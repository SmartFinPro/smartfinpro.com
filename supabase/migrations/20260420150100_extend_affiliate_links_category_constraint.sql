-- Extend affiliate_links.category CHECK constraint — add credit-repair + credit-score + gold-investing
--
-- Context: the-credit-people (US, 32 content refs) ist der nächste priorisierte
-- Orphan-Slug. Die passende Kategorie ist "credit-repair", der aktuelle
-- CHECK-Constraint erlaubt nur 6 Werte (siehe schema.sql:21).
--
-- Rationale: "credit-score" wird gleichzeitig freigeschaltet, weil der
-- us/credit-score/*-Hub (mehrere Pages) langfristig ebenfalls Affiliate-Slugs
-- bekommen soll. Einmal-Migration > zweimal ALTER in kurzem Abstand.
--
-- "gold-investing": bereits in 2 Live-Rows verwendet (Daten-Drift — der alte
-- restriktivere CHECK wurde historisch offenbar in der Live-DB gedroppt,
-- Rows sind eingeschlüpft). Ohne Aufnahme würde die neue CHECK an genau
-- diesen Bestandszeilen violaten (23514). Minimum-Viable-Fix: als 9. Wert
-- aufnehmen, übrige ungenutzte Site-Kategorien bleiben außen vor bis zu
-- konkretem Aktivierungs-Ticket.
--
-- WICHTIG — robust gegen unbekannten Constraint-Namen:
-- In schema.sql:21 ist der CHECK inline auf der Spalte deklariert. Postgres
-- generiert den Constraint-Namen dann automatisch (z.B.
-- affiliate_links_category_check, affiliate_links_category_check1, oder ein
-- anderes Muster). Ein statisches DROP CONSTRAINT IF EXISTS <name> wäre bei
-- abweichendem Namen still no-op → alter restriktiver Check bliebe aktiv und
-- würde jeden `credit-repair`-Insert weiter blocken, obwohl die Migration
-- "erfolgreich" liefe. Der DO-Block findet deshalb ALLE Check-Constraints auf
-- affiliate_links, deren Definition die Spalte category referenziert, und
-- dropt sie — dann wird der neue, saubere Check mit festem Namen angelegt.
--
-- Follow-up (gleicher PR, nicht Teil dieser Migration):
--   - supabase/schema.sql:21 inline CHECK auf 8 Werte synchronisieren.
--   - scripts/mcp-server/validation.ts:13 + :181 Category-Allowlist auf 8 Werte
--     synchronisieren. Ohne diesen Edit lehnt der MCP-Write-Pfad
--     (activate_affiliate_slug) credit-repair weiterhin ab, obwohl der
--     DB-Constraint bereits erweitert ist.

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE cls.relname = 'affiliate_links'
      AND ns.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.affiliate_links DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE public.affiliate_links
  ADD CONSTRAINT affiliate_links_category_check
  CHECK (category IN (
    'ai-tools',
    'cybersecurity',
    'trading',
    'forex',
    'personal-finance',
    'business-banking',
    'credit-repair',
    'credit-score',
    'gold-investing'
  ));
