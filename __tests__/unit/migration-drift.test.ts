// __tests__/unit/migration-drift.test.ts
// Unit tests for the migration drift checker's pure logic.
//
// The old bash checker reported all 146 migrations as "NOT APPLIED" because its
// remote lookup silently returned an empty list. These tests pin down the two
// pieces that decide truth: the SQL object parser and the classifier that
// compares parsed objects against the live schema.

import { describe, it, expect } from 'vitest';
import {
  stripSqlNoise,
  parseMigrationObjects,
  classifyMigrations,
} from '../../scripts/lib/migration-drift.mjs';

describe('stripSqlNoise', () => {
  it('removes line comments so rollback notes are not parsed as DDL', () => {
    const out = stripSqlNoise('-- Rollback: DROP TABLE IF EXISTS foo;\nSELECT 1;');
    expect(out).not.toMatch(/DROP TABLE/i);
    expect(out).toMatch(/SELECT 1/);
  });

  it('removes block comments', () => {
    const out = stripSqlNoise('/* CREATE TABLE ghost (id int); */ SELECT 1;');
    expect(out).not.toMatch(/CREATE TABLE/i);
  });

  it('blanks string literals but keeps offsets stable', () => {
    const sql = "SELECT 'CREATE TABLE ghost';";
    const out = stripSqlNoise(sql);
    expect(out).not.toMatch(/CREATE TABLE/i);
    expect(out.length).toBe(sql.length);
  });

  it('handles doubled single quotes inside literals', () => {
    const out = stripSqlNoise("SELECT 'it''s ok'; CREATE TABLE real_one (id int);");
    expect(out).toMatch(/CREATE TABLE real_one/i);
  });

  it('keeps DDL inside dollar-quoted DO blocks (it really executes)', () => {
    const out = stripSqlNoise('DO $$ BEGIN ALTER TABLE t ADD COLUMN c int; END $$;');
    expect(out).toMatch(/ALTER TABLE t ADD COLUMN c/i);
  });

  it('blanks single-quoted strings nested inside dollar-quoted blocks', () => {
    const out = stripSqlNoise("DO $$ BEGIN RAISE EXCEPTION 'CREATE TABLE ghost'; END $$;");
    expect(out).not.toMatch(/CREATE TABLE/i);
  });
});

describe('parseMigrationObjects', () => {
  it('extracts a created table and its columns', () => {
    const o = parseMigrationObjects(`
      CREATE TABLE IF NOT EXISTS public.blocked_ips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address INET NOT NULL,
        reason TEXT,
        CONSTRAINT blocked_ips_unique UNIQUE (ip_address)
      );
    `);
    expect(o.createsTables).toEqual([
      { table: 'blocked_ips', columns: ['id', 'ip_address', 'reason'] },
    ]);
  });

  it('ignores table-level constraint clauses when reading columns', () => {
    const o = parseMigrationObjects(`
      CREATE TABLE t (
        id int,
        PRIMARY KEY (id),
        UNIQUE (id),
        FOREIGN KEY (id) REFERENCES other(id),
        CHECK (id > 0)
      );
    `);
    expect(o.createsTables[0].columns).toEqual(['id']);
  });

  it('does not mistake nested type parens for a column separator', () => {
    const o = parseMigrationObjects(`
      CREATE TABLE t (
        amount DECIMAL(12,2),
        kind VARCHAR(20) CHECK (kind IN ('a','b')),
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);
    expect(o.createsTables[0].columns).toEqual(['amount', 'kind', 'payload']);
  });

  it('extracts every ADD COLUMN of a multi-column ALTER TABLE', () => {
    const o = parseMigrationObjects(`
      ALTER TABLE public.product_attributes
        ADD COLUMN IF NOT EXISTS topic            VARCHAR(60),
        ADD COLUMN IF NOT EXISTS management_fee   DECIMAL(6,3),
        ADD COLUMN IF NOT EXISTS attributes       JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    expect(o.addsColumns).toEqual([
      { table: 'product_attributes', column: 'topic' },
      { table: 'product_attributes', column: 'management_fee' },
      { table: 'product_attributes', column: 'attributes' },
    ]);
  });

  it('handles ALTER TABLE IF EXISTS and quoted identifiers', () => {
    const o = parseMigrationObjects('ALTER TABLE IF EXISTS "affiliate_links" ADD COLUMN "network" TEXT;');
    expect(o.addsColumns).toEqual([{ table: 'affiliate_links', column: 'network' }]);
  });

  it('does not read ADD CONSTRAINT as a column', () => {
    const o = parseMigrationObjects(`
      ALTER TABLE affiliate_links
        ADD CONSTRAINT affiliate_links_category_check
        CHECK (category IN ('ai-tools', 'trading'));
    `);
    expect(o.addsColumns).toEqual([]);
  });

  it('ignores DDL that only appears in comments', () => {
    const o = parseMigrationObjects(`
      -- Rollback: DROP TABLE IF EXISTS conversion_status_audit;
      -- ALTER TABLE conversions DROP COLUMN IF EXISTS network;
      CREATE TABLE conversion_status_audit (id int);
    `);
    expect(o.createsTables.map((t) => t.table)).toEqual(['conversion_status_audit']);
    expect(o.dropsTables).toEqual([]);
    expect(o.dropsColumns).toEqual([]);
  });

  it('extracts views, including CREATE OR REPLACE and MATERIALIZED', () => {
    const o = parseMigrationObjects(`
      CREATE OR REPLACE VIEW crawl_status_thin_content AS SELECT 1;
      CREATE MATERIALIZED VIEW public.mv_stats AS SELECT 1;
    `);
    expect(o.createsViews).toEqual(['crawl_status_thin_content', 'mv_stats']);
  });

  it('records real drops and renames', () => {
    const o = parseMigrationObjects(`
      DROP TABLE IF EXISTS legacy_clicks;
      ALTER TABLE old_name RENAME TO new_name;
      ALTER TABLE t RENAME COLUMN a TO b;
      ALTER TABLE t DROP COLUMN IF EXISTS gone;
    `);
    expect(o.dropsTables).toEqual(['legacy_clicks']);
    expect(o.renamesTables).toEqual([{ from: 'old_name', to: 'new_name' }]);
    expect(o.renamesColumns).toEqual([{ table: 't', from: 'a', to: 'b' }]);
    expect(o.dropsColumns).toEqual([{ table: 't', column: 'gone' }]);
  });

  it('skips objects in non-public schemas (not visible via PostgREST)', () => {
    const o = parseMigrationObjects('CREATE TABLE auth.sessions (id int); CREATE TABLE public.ok (id int);');
    expect(o.createsTables.map((t) => t.table)).toEqual(['ok']);
    expect(o.skippedSchemas).toContain('auth');
  });

  it('returns nothing checkable for seed-only migrations', () => {
    const o = parseMigrationObjects("INSERT INTO affiliate_links (slug) VALUES ('foo');");
    expect(o.createsTables).toEqual([]);
    expect(o.addsColumns).toEqual([]);
    expect(o.createsViews).toEqual([]);
  });

  it('picks up conditional DDL inside DO blocks', () => {
    const o = parseMigrationObjects(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE column_name = 'button_id') THEN
          ALTER TABLE link_clicks ADD COLUMN button_id VARCHAR(100);
        END IF;
      END $$;
    `);
    expect(o.addsColumns).toEqual([{ table: 'link_clicks', column: 'button_id' }]);
  });
});

describe('classifyMigrations', () => {
  const live = {
    subscribers: ['id', 'email'],
    link_clicks: ['id', 'button_id'],
  };

  it('marks a migration applied when all its objects exist live', () => {
    const { results } = classifyMigrations({
      migrations: [{ name: '001_subs.sql', sql: 'CREATE TABLE subscribers (id int, email text);' }],
      liveSchema: live,
    });
    expect(results[0].status).toBe('applied');
    expect(results[0].missing).toEqual([]);
  });

  it('flags drift when a created table is absent live', () => {
    const { results, summary } = classifyMigrations({
      migrations: [{ name: '20260306100000_blocked_ips.sql', sql: 'CREATE TABLE blocked_ips (id int);' }],
      liveSchema: live,
    });
    expect(results[0].status).toBe('drift');
    expect(results[0].missing).toEqual(['table:blocked_ips']);
    expect(summary.drift).toBe(1);
  });

  it('flags a missing column on an existing table', () => {
    const { results } = classifyMigrations({
      migrations: [{ name: '004.sql', sql: 'ALTER TABLE subscribers ADD COLUMN sequence_step int;' }],
      liveSchema: live,
    });
    expect(results[0].missing).toEqual(['column:subscribers.sequence_step']);
  });

  it('reports the missing table once instead of every column on it', () => {
    const { results } = classifyMigrations({
      migrations: [{ name: '004.sql', sql: 'CREATE TABLE ghost (id int, a int, b int);' }],
      liveSchema: live,
    });
    expect(results[0].missing).toEqual(['table:ghost']);
  });

  it('marks seed-only migrations unverifiable, never silently applied', () => {
    const { results, summary } = classifyMigrations({
      migrations: [{ name: 'seed.sql', sql: "INSERT INTO subscribers (email) VALUES ('a@b.c');" }],
      liveSchema: live,
    });
    expect(results[0].status).toBe('unverifiable');
    expect(summary.applied).toBe(0);
    expect(summary.unverifiable).toBe(1);
  });

  it('marks an object superseded when a later migration drops it', () => {
    const { results, summary } = classifyMigrations({
      migrations: [
        { name: '001.sql', sql: 'CREATE TABLE temp_thing (id int);' },
        { name: '002.sql', sql: 'DROP TABLE temp_thing;' },
      ],
      liveSchema: live,
    });
    expect(results[0].status).toBe('superseded');
    expect(summary.drift).toBe(0);
  });

  it('follows a later rename instead of reporting the old name as drift', () => {
    const { results } = classifyMigrations({
      migrations: [
        { name: '001.sql', sql: 'CREATE TABLE old_subs (id int);' },
        { name: '002.sql', sql: 'ALTER TABLE old_subs RENAME TO subscribers;' },
      ],
      liveSchema: live,
    });
    expect(results[0].status).toBe('applied');
  });

  it('checks existence only when one migration defines a name as both table and view', () => {
    // 005_missing_dashboard_tables.sql creates newsletter_subscribers as a VIEW
    // or as a TABLE depending on a runtime IF/ELSE. Only one branch runs, so the
    // table branch's columns must not be treated as an expectation.
    const { results } = classifyMigrations({
      migrations: [{
        name: '005.sql',
        sql: `DO $$ BEGIN
                IF EXISTS (SELECT 1) THEN
                  CREATE OR REPLACE VIEW newsletter_subscribers AS SELECT id FROM subscribers;
                ELSE
                  CREATE TABLE IF NOT EXISTS newsletter_subscribers (id int, user_agent text);
                END IF;
              END $$;`,
      }],
      liveSchema: { newsletter_subscribers: ['id', 'email'] },
    });
    expect(results[0].missing).toEqual([]);
    expect(results[0].status).toBe('applied');
  });

  it('drops column expectations once a later migration redefines the object', () => {
    const { results } = classifyMigrations({
      migrations: [
        { name: '005.sql', sql: 'CREATE TABLE newsletter_subscribers (id int, user_agent text);' },
        { name: '022.sql', sql: 'CREATE OR REPLACE VIEW newsletter_subscribers AS SELECT id FROM subscribers;' },
      ],
      liveSchema: { newsletter_subscribers: ['id'] },
    });
    expect(results[0].missing).toEqual([]);
    expect(results[1].missing).toEqual([]);
  });

  it('still flags the object as drift when a redefined name is absent entirely', () => {
    const { results } = classifyMigrations({
      migrations: [
        { name: '005.sql', sql: 'CREATE TABLE ghost (id int, user_agent text);' },
        { name: '022.sql', sql: 'CREATE OR REPLACE VIEW ghost AS SELECT 1;' },
      ],
      liveSchema: { subscribers: ['id'] },
    });
    expect(results[0].missing).toEqual(['table:ghost']);
    expect(results[1].missing).toEqual(['table:ghost']);
  });

  it('accepts a table confirmed by direct probe but skips its unknown columns', () => {
    // The PostgREST OpenAPI listing is built from a schema cache that lags DDL.
    // A table confirmed by a direct request counts as present, but we have no
    // column list for it and must not invent drift from that.
    const { results } = classifyMigrations({
      migrations: [{ name: '001.sql', sql: 'CREATE TABLE blocked_ips (id int, expires_at timestamptz);' }],
      liveSchema: { ...live, blocked_ips: [] },
      unknownColumnTables: ['blocked_ips'],
    });
    expect(results[0].missing).toEqual([]);
    expect(results[0].status).toBe('applied');
  });

  it('downgrades baselined drift to known-drift so CI stays actionable', () => {
    const { results, summary, staleBaseline } = classifyMigrations({
      migrations: [{ name: '20260306100000_blocked_ips.sql', sql: 'CREATE TABLE blocked_ips (id int);' }],
      liveSchema: live,
      baseline: ['20260306100000_blocked_ips.sql'],
    });
    expect(results[0].status).toBe('known-drift');
    expect(summary.drift).toBe(0);
    expect(summary.knownDrift).toBe(1);
    expect(staleBaseline).toEqual([]);
  });

  it('reports a baseline entry that no longer drifts as stale', () => {
    const { staleBaseline } = classifyMigrations({
      migrations: [{ name: '001.sql', sql: 'CREATE TABLE subscribers (id int);' }],
      liveSchema: live,
      baseline: ['001.sql'],
    });
    expect(staleBaseline).toEqual(['001.sql']);
  });

  it('reports a baseline entry for an unknown file as stale', () => {
    const { staleBaseline } = classifyMigrations({
      migrations: [{ name: '001.sql', sql: 'CREATE TABLE subscribers (id int);' }],
      liveSchema: live,
      baseline: ['999_deleted.sql'],
    });
    expect(staleBaseline).toEqual(['999_deleted.sql']);
  });
});
