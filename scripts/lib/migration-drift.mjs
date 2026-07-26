// scripts/lib/migration-drift.mjs
// Pure logic for the migration drift checker — no IO, no network, fully unit tested
// in __tests__/unit/migration-drift.test.ts.
//
// Why object-level checking instead of the migration ledger:
// supabase_migrations.schema_migrations is not reachable through PostgREST
// ("Only the following schemas are exposed: public, graphql_public") and this
// project applied most of its migrations through the SQL editor / ad-hoc REST
// scripts rather than `supabase db push`, so the ledger is incomplete anyway.
// What we *can* observe with the service key is the live schema, so we verify
// the objects each migration is supposed to create. That is exactly the signal
// that was missing when 20260306100000_blocked_ips.sql never reached prod.

/**
 * Remove comments and blank out string literals, preserving byte offsets so
 * callers can slice the result by index.
 *
 * Dollar-quoted bodies (DO $$ ... $$) are deliberately kept as live SQL: the
 * DDL inside them really executes. Single-quoted strings nested inside them are
 * still blanked.
 *
 * @param {string} sql
 * @returns {string}
 */
export function stripSqlNoise(sql) {
  const out = Array.from(sql);
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) {
      if (out[k] !== '\n') out[k] = ' ';
    }
  };

  let i = 0;
  while (i < sql.length) {
    // Line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i);
      blank(i, end === -1 ? sql.length : end);
      i = end === -1 ? sql.length : end;
      continue;
    }
    // Block comment (Postgres allows nesting)
    if (sql[i] === '/' && sql[i + 1] === '*') {
      let depth = 1;
      let j = i + 2;
      while (j < sql.length && depth > 0) {
        if (sql[j] === '/' && sql[j + 1] === '*') { depth++; j += 2; continue; }
        if (sql[j] === '*' && sql[j + 1] === '/') { depth--; j += 2; continue; }
        j++;
      }
      blank(i, j);
      i = j;
      continue;
    }
    // Single-quoted literal ('' escapes a quote)
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
        if (sql[j] === "'") { j++; break; }
        j++;
      }
      blank(i, j);
      i = j;
      continue;
    }
    // Dollar-quote delimiter: blank the marker only, keep the body executable
    const dollar = /^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/.exec(sql.slice(i));
    if (dollar) {
      blank(i, i + dollar[0].length);
      i += dollar[0].length;
      continue;
    }
    i++;
  }

  return out.join('');
}

const IDENT = '(?:"([a-zA-Z0-9_]+)"|([a-zA-Z0-9_]+))';
const QUALIFIED = `(?:(?:"?([a-zA-Z0-9_]+)"?)\\s*\\.\\s*)?${IDENT}`;

/** Pull (schema, name) out of a QUALIFIED match. */
function qualified(m, offset) {
  const schema = m[offset];
  const name = m[offset + 1] || m[offset + 2];
  return { schema: schema ? schema.toLowerCase() : null, name: name ? name.toLowerCase() : null };
}

// Statement starts we care about. Everything else (INSERT, CREATE INDEX,
// CREATE POLICY, GRANT, ...) is not verifiable through PostgREST.
const DDL_RE = new RegExp(
  [
    'create\\s+table(?:\\s+if\\s+not\\s+exists)?',
    'create(?:\\s+or\\s+replace)?(?:\\s+temp(?:orary)?)?(?:\\s+materialized)?\\s+view(?:\\s+if\\s+not\\s+exists)?',
    'alter\\s+table(?:\\s+if\\s+exists)?(?:\\s+only)?',
    'drop\\s+table(?:\\s+if\\s+exists)?',
    'drop(?:\\s+materialized)?\\s+view(?:\\s+if\\s+exists)?',
  ].join('|'),
  'gi',
);

/** Index of the next top-level `;` at or after `from`. */
function nextSemicolon(sql, from) {
  const idx = sql.indexOf(';', from);
  return idx === -1 ? sql.length : idx;
}

/**
 * Split a `CREATE TABLE (...)` body on top-level commas and keep the entries
 * that define a column (i.e. not table-level constraints).
 *
 * @param {string} body
 * @returns {string[]} column names, lowercased
 */
function columnsFromTableBody(body) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  parts.push(current);

  const TABLE_CONSTRAINT = /^(constraint|primary|unique|foreign|check|exclude|like|partition)\b/i;
  const cols = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part || TABLE_CONSTRAINT.test(part)) continue;
    const m = /^(?:"([a-zA-Z0-9_]+)"|([a-zA-Z0-9_]+))/.exec(part);
    if (m) cols.push((m[1] || m[2]).toLowerCase());
  }
  return cols;
}

/** Extract the parenthesised body starting at the first `(` at/after `from`. */
function parenBody(sql, from) {
  const open = sql.indexOf('(', from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === '(') depth++;
    else if (sql[i] === ')') {
      depth--;
      if (depth === 0) return sql.slice(open + 1, i);
    }
  }
  return null;
}

/**
 * Parse the schema objects a migration creates, drops or renames.
 *
 * Only `public` (or unqualified) objects are returned — those are the ones
 * PostgREST exposes and therefore the ones we can verify.
 *
 * @param {string} rawSql
 */
export function parseMigrationObjects(rawSql) {
  const sql = stripSqlNoise(rawSql);
  /**
   * @type {{
   *   createsTables: {table: string, columns: string[]}[],
   *   createsViews: string[],
   *   addsColumns: {table: string, column: string}[],
   *   dropsTables: string[],
   *   dropsColumns: {table: string, column: string}[],
   *   renamesTables: {from: string, to: string}[],
   *   renamesColumns: {table: string, from: string, to: string}[],
   *   skippedSchemas: string[],
   * }}
   */
  const result = {
    createsTables: [],   // [{ table, columns: string[] }]
    createsViews: [],    // string[]
    addsColumns: [],     // [{ table, column }]
    dropsTables: [],     // string[]
    dropsColumns: [],    // [{ table, column }]
    renamesTables: [],   // [{ from, to }]
    renamesColumns: [],  // [{ table, from, to }]
    skippedSchemas: [],  // schemas we deliberately ignore, e.g. auth/storage
  };

  const starts = [];
  DDL_RE.lastIndex = 0;
  for (let m = DDL_RE.exec(sql); m; m = DDL_RE.exec(sql)) {
    starts.push({ index: m.index, keyword: m[0].replace(/\s+/g, ' ').toLowerCase() });
  }

  const noteSchema = (schema) => {
    if (schema && schema !== 'public' && !result.skippedSchemas.includes(schema)) {
      result.skippedSchemas.push(schema);
    }
  };

  for (let s = 0; s < starts.length; s++) {
    const { index, keyword } = starts[s];
    const nextStart = s + 1 < starts.length ? starts[s + 1].index : sql.length;
    // A statement ends at its `;`. Column definitions of a CREATE TABLE may not
    // contain one, so the next DDL start is a safe upper bound either way.
    const end = Math.min(nextSemicolon(sql, index), nextStart);
    const segment = sql.slice(index, end);
    const after = segment.slice(keyword.length);

    const nameRe = new RegExp(`^\\s*${QUALIFIED}`);
    const nameMatch = nameRe.exec(after);
    if (!nameMatch) continue;
    const { schema, name } = qualified(nameMatch, 1);
    if (!name) continue;
    if (schema && schema !== 'public') { noteSchema(schema); continue; }

    if (keyword.startsWith('create table')) {
      const body = parenBody(segment, nameMatch[0].length);
      result.createsTables.push({ table: name, columns: body ? columnsFromTableBody(body) : [] });
      continue;
    }

    if (keyword.includes('view') && keyword.startsWith('create')) {
      result.createsViews.push(name);
      continue;
    }

    if (keyword.startsWith('drop table') || (keyword.startsWith('drop') && keyword.includes('view'))) {
      result.dropsTables.push(name);
      continue;
    }

    if (keyword.startsWith('alter table')) {
      const rest = after.slice(nameMatch[0].length);

      // RENAME TO / RENAME COLUMN a TO b
      const renameCol = new RegExp(`\\brename\\s+column\\s+${IDENT}\\s+to\\s+${IDENT}`, 'i').exec(rest);
      if (renameCol) {
        result.renamesColumns.push({
          table: name,
          from: (renameCol[1] || renameCol[2]).toLowerCase(),
          to: (renameCol[3] || renameCol[4]).toLowerCase(),
        });
      }
      const renameTable = new RegExp(`\\brename\\s+to\\s+${IDENT}`, 'i').exec(rest);
      if (renameTable && !renameCol) {
        result.renamesTables.push({ from: name, to: (renameTable[1] || renameTable[2]).toLowerCase() });
      }

      // ADD COLUMN [IF NOT EXISTS] name — a single ALTER may carry several.
      const addRe = new RegExp(`\\badd\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?${IDENT}`, 'gi');
      for (let a = addRe.exec(rest); a; a = addRe.exec(rest)) {
        result.addsColumns.push({ table: name, column: (a[1] || a[2]).toLowerCase() });
      }

      // DROP COLUMN [IF EXISTS] name
      const dropRe = new RegExp(`\\bdrop\\s+column\\s+(?:if\\s+exists\\s+)?${IDENT}`, 'gi');
      for (let d = dropRe.exec(rest); d; d = dropRe.exec(rest)) {
        result.dropsColumns.push({ table: name, column: (d[1] || d[2]).toLowerCase() });
      }
    }
  }

  return result;
}

/**
 * Normalise a live schema description into Map<table, Set<column>>.
 * @param {Record<string, string[]> | Map<string, Set<string>>} liveSchema
 */
function toLiveMap(liveSchema) {
  if (liveSchema instanceof Map) return liveSchema;
  return new Map(Object.entries(liveSchema).map(([t, cols]) => [t.toLowerCase(), new Set(cols)]));
}

/**
 * Compare parsed migrations against the live schema.
 *
 * Statuses:
 *   applied      — every checkable object exists live
 *   drift        — at least one object is missing (fails the check)
 *   known-drift  — missing, but listed in the baseline (reported, does not fail)
 *   superseded   — every object was dropped/renamed away by a later migration
 *   unverifiable — nothing PostgREST can see (seeds, RLS, indexes, functions)
 *
 * `unknownColumnTables` lists tables whose existence is confirmed but whose
 * column list is unknown (e.g. confirmed by a direct probe after the PostgREST
 * schema cache turned out to be stale). Their columns are never reported.
 *
 * @param {{ migrations: {name: string, sql: string}[],
 *           liveSchema: Record<string, string[]> | Map<string, Set<string>>,
 *           baseline?: string[],
 *           unknownColumnTables?: string[] }} input
 */
export function classifyMigrations({ migrations, liveSchema, baseline = [], unknownColumnTables = [] }) {
  const live = toLiveMap(liveSchema);
  const baselineSet = new Set(baseline);
  const columnsUnknown = new Set(unknownColumnTables.map((t) => t.toLowerCase()));
  const parsed = migrations.map((m) => ({ ...m, objects: parseMigrationObjects(m.sql) }));

  // Resolve a table name forward through renames/drops that happen after `from`.
  const resolveTable = (table, from) => {
    let current = table;
    for (let i = from + 1; i < parsed.length; i++) {
      const o = parsed[i].objects;
      if (o.dropsTables.includes(current)) return { name: current, dropped: true };
      const rename = o.renamesTables.find((r) => r.from === current);
      if (rename) current = rename.to;
    }
    return { name: current, dropped: false };
  };

  const resolveColumn = (table, column, from) => {
    let currentTable = table;
    let currentColumn = column;
    for (let i = from + 1; i < parsed.length; i++) {
      const o = parsed[i].objects;
      if (o.dropsTables.includes(currentTable)) return { dropped: true };
      if (o.dropsColumns.some((c) => c.table === currentTable && c.column === currentColumn)) {
        return { dropped: true };
      }
      const renameCol = o.renamesColumns.find((r) => r.table === currentTable && r.from === currentColumn);
      if (renameCol) currentColumn = renameCol.to;
      const renameTable = o.renamesTables.find((r) => r.from === currentTable);
      if (renameTable) currentTable = renameTable.to;
    }
    return { table: currentTable, column: currentColumn, dropped: false };
  };

  const results = [];
  const summary = { total: parsed.length, applied: 0, drift: 0, knownDrift: 0, superseded: 0, unverifiable: 0 };

  parsed.forEach((migration, index) => {
    const { objects } = migration;
    const missing = [];
    let checked = 0;
    let supersededCount = 0;

    const missingTables = new Set();

    for (const created of [...objects.createsTables.map((t) => t.table), ...objects.createsViews]) {
      const resolved = resolveTable(created, index);
      if (resolved.dropped) { supersededCount++; continue; }
      checked++;
      if (!live.has(resolved.name)) {
        missing.push(`table:${resolved.name}`);
        missingTables.add(created);
      }
    }

    // A name that this migration defines more than once comes from a runtime
    // IF/ELSE (005 creates newsletter_subscribers as a view OR as a table).
    // Only one branch ever runs, so its column list is not an expectation.
    const definedNames = [...objects.createsTables.map((t) => t.table), ...objects.createsViews];
    const ambiguous = new Set(definedNames.filter((n, i) => definedNames.indexOf(n) !== i));

    // Same for a name a later migration redefines — the newest shape wins.
    const redefinedLater = (table) => {
      const finalName = resolveTable(table, index).name;
      return parsed.slice(index + 1).some((later) =>
        later.objects.createsViews.includes(finalName)
        || later.objects.createsTables.some((t) => t.table === finalName));
    };

    // Columns of a freshly created table only matter if the table itself is
    // there — otherwise we would report the same failure N times.
    for (const created of objects.createsTables) {
      if (missingTables.has(created.table)) continue;
      if (ambiguous.has(created.table) || redefinedLater(created.table)) continue;
      for (const column of created.columns) {
        const resolved = resolveColumn(created.table, column, index);
        if (resolved.dropped) { supersededCount++; continue; }
        if (!live.has(resolved.table) || columnsUnknown.has(resolved.table)) continue;
        checked++;
        if (!live.get(resolved.table).has(resolved.column)) {
          missing.push(`column:${resolved.table}.${resolved.column}`);
        }
      }
    }

    for (const add of objects.addsColumns) {
      const resolved = resolveColumn(add.table, add.column, index);
      if (resolved.dropped) { supersededCount++; continue; }
      checked++;
      if (!live.has(resolved.table)) {
        const key = `table:${resolved.table}`;
        if (!missing.includes(key)) missing.push(key);
        continue;
      }
      if (columnsUnknown.has(resolved.table)) continue;
      if (!live.get(resolved.table).has(resolved.column)) {
        missing.push(`column:${resolved.table}.${resolved.column}`);
      }
    }

    let status;
    if (checked === 0) status = supersededCount > 0 ? 'superseded' : 'unverifiable';
    else if (missing.length === 0) status = 'applied';
    else status = baselineSet.has(migration.name) ? 'known-drift' : 'drift';

    if (status === 'applied') summary.applied++;
    else if (status === 'drift') summary.drift++;
    else if (status === 'known-drift') summary.knownDrift++;
    else if (status === 'superseded') summary.superseded++;
    else summary.unverifiable++;

    results.push({ name: migration.name, status, missing, checked, skippedSchemas: objects.skippedSchemas });
  });

  // A baseline entry is stale once the migration is applied (or the file is
  // gone) — keeping it would quietly re-open the blind spot we just closed.
  const drifting = new Set(results.filter((r) => r.status === 'known-drift').map((r) => r.name));
  const staleBaseline = baseline.filter((name) => !drifting.has(name));

  return { results, summary, staleBaseline };
}
