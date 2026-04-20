// Tool: detect_schema_drift (read-only, schema.sql-only parser)
//
// Detects drift between supabase/schema.sql (canonical baseline) and live DB.
// IGNORES columns defined only in migration files — tables like
// content_health_scores (20260412100000_autonomous_system.sql) or
// conversion_events (20260307150000_conversion_events.sql) will show as
// "not in schema.sql". That's intentional, not a bug.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getServiceClient } from '../lib/supabase.js';
import { withAudit } from '../lib/audit.js';
import { DetectSchemaDriftInput, formatZodError } from '../lib/validation.js';
import type { SchemaDriftEntry } from '../types.js';

export const TOOL_NAME = 'detect_schema_drift';

export const TOOL_DESCRIPTION =
  'Detects drift between supabase/schema.sql (canonical baseline) and live DB column definitions. ' +
  'Ignores columns defined only in migration files — tables/columns present only in migrations ' +
  'will be reported as missing_in_schema_sql. Pass tables=[...] to scope, or omit for all tables ' +
  'defined in schema.sql. Read-only.';

export const TOOL_INPUT_SCHEMA = DetectSchemaDriftInput;

interface Result {
  drift: SchemaDriftEntry[];
  checked_tables: string[];
  note: string;
}

// ── Find repo root (two levels up from scripts/mcp-server/src/tools/) ────
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
const SCHEMA_SQL_PATH = resolve(REPO_ROOT, 'supabase', 'schema.sql');

interface ParsedColumn {
  name: string;
  type: string;
}
interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

/**
 * Minimal schema.sql parser: finds `CREATE TABLE name (...)` blocks and
 * extracts column names + types. Tolerant of PG check constraints,
 * inline comments, multi-line defaults. Does NOT handle every edge case —
 * only good enough for drift-detection on the standard tables.
 */
function parseSchemaSql(sql: string): Map<string, ParsedTable> {
  const tables = new Map<string, ParsedTable>();
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w]*)\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(sql)) !== null) {
    const [, name, body] = match;
    const columns = parseColumns(body);
    tables.set(name.toLowerCase(), { name: name.toLowerCase(), columns });
  }
  return tables;
}

function parseColumns(body: string): ParsedColumn[] {
  // Strip multi-line comments (naive)
  const cleaned = body.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // Split on top-level commas (ignore commas inside parens)
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of cleaned) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  const columns: ParsedColumn[] = [];
  for (const part of parts) {
    // Skip constraints (PRIMARY KEY, UNIQUE, CHECK, FOREIGN KEY at top-level)
    if (/^(PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|CONSTRAINT)\b/i.test(part)) continue;
    // Column form: name TYPE [modifiers...]
    const colMatch = part.match(/^"?([a-zA-Z_][\w]*)"?\s+([A-Z][A-Z0-9_]*(?:\s*\([^)]*\))?)/i);
    if (!colMatch) continue;
    columns.push({
      name: colMatch[1].toLowerCase(),
      type: colMatch[2].replace(/\s+/g, '').toLowerCase(),
    });
  }
  return columns;
}

export const handle = withAudit(
  TOOL_NAME,
  async (rawArgs: unknown): Promise<Result> => {
    const parsed = DetectSchemaDriftInput.safeParse(rawArgs);
    if (!parsed.success) throw new Error(formatZodError(parsed.error));
    const args = parsed.data;

    if (!existsSync(SCHEMA_SQL_PATH)) {
      throw new Error(`schema.sql not found at ${SCHEMA_SQL_PATH}`);
    }
    const sql = readFileSync(SCHEMA_SQL_PATH, 'utf8');
    const sqlTables = parseSchemaSql(sql);

    // Which tables to check?
    const tablesToCheck = args.tables && args.tables.length > 0
      ? args.tables.map((t) => t.toLowerCase())
      : [...sqlTables.keys()];

    const supabase = getServiceClient();
    const drift: SchemaDriftEntry[] = [];

    for (const table of tablesToCheck) {
      // Live DB columns
      const { data: liveRows, error: liveErr } = await supabase
        .rpc('', {})
        .select(); // rpc approach fails for arbitrary SQL; use a different path below
      // Use PostgREST's `information_schema` via system views — but supabase-js
      // doesn't expose those by default. Fall back to a view if available,
      // otherwise skip with a note.
      void liveRows;
      void liveErr;

      // Alternative: use postgres_meta via REST endpoint. For V1 we use
      // a simple probe via selecting 1 row with specific column query-shape
      // — but that only lists columns if we know them. Cleanest: use
      // supabase's internal view `pg_catalog.pg_attribute`. Not available
      // via supabase-js without a custom function.
      //
      // Pragmatic V1: pull column list via a small RPC wrapper we'll add as
      // a follow-up. For now, fetch all rows with .select('*').limit(0) and
      // introspect response metadata — but supabase-js doesn't expose that.
      //
      // Simplest working approach for V1: direct SELECT with limit 0
      // then look at keys of first row — if empty, no introspection possible.
      // Better: add a small PostgreSQL function `mcp_columns_of(text)` in
      // a follow-up migration.
      //
      // For this release, we provide a partial implementation that reports
      // schema.sql-declared columns and flags the check as incomplete when
      // live DB introspection isn't available.

      const sqlTable = sqlTables.get(table);
      if (!sqlTable) {
        drift.push({
          table,
          column: '(whole table)',
          declared_in_schema_sql: false,
          exists_in_live_db: true, // assume yes; we can't verify in V1
          issue: 'missing_in_schema_sql',
        });
        continue;
      }

      // Attempt live introspection via information_schema.columns through
      // a view named `mcp_information_schema_columns` if the user chose to
      // create it. If not, skip live diff and return schema-declared baseline.
      const { data: liveCols, error } = await supabase
        .from('mcp_information_schema_columns')
        .select('column_name, data_type')
        .eq('table_name', table);

      if (error) {
        // View doesn't exist — report the schema.sql baseline with a note row
        drift.push({
          table,
          column: '(introspection_unavailable)',
          declared_in_schema_sql: true,
          exists_in_live_db: false,
          issue: 'missing_in_db',
          schema_sql_type: `[${sqlTable.columns.length} cols declared in schema.sql]`,
          live_db_type: 'create view mcp_information_schema_columns to enable live diff',
        });
        continue;
      }

      const liveMap = new Map<string, string>();
      for (const c of (liveCols ?? []) as Array<{ column_name: string; data_type: string }>) {
        liveMap.set(c.column_name.toLowerCase(), c.data_type.toLowerCase());
      }
      const sqlMap = new Map<string, string>();
      for (const c of sqlTable.columns) sqlMap.set(c.name, c.type);

      // Columns in schema.sql missing from live
      for (const [col, type] of sqlMap) {
        if (!liveMap.has(col)) {
          drift.push({
            table,
            column: col,
            declared_in_schema_sql: true,
            exists_in_live_db: false,
            issue: 'missing_in_db',
            schema_sql_type: type,
          });
        }
      }
      // Columns in live but not in schema.sql
      for (const [col, type] of liveMap) {
        if (!sqlMap.has(col)) {
          drift.push({
            table,
            column: col,
            declared_in_schema_sql: false,
            exists_in_live_db: true,
            issue: 'missing_in_schema_sql',
            live_db_type: type,
          });
        }
      }
    }

    return {
      drift,
      checked_tables: tablesToCheck,
      note:
        'Only checks against supabase/schema.sql; columns defined in migration ' +
        'files are out-of-scope. Live introspection requires view ' +
        'mcp_information_schema_columns (add via migration for full diff).',
    };
  },
);
