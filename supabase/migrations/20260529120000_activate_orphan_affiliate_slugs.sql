-- ============================================================
-- Migration: Activate orphan affiliate slugs (Befund F-01)
-- Date: 2026-05-29
-- ============================================================
--
-- KONTEXT: Audit fand 139 /go/<slug>-Referenzen in content/**/*.mdx ohne
-- aktiven affiliate_links-Eintrag. Verwaiste Slugs fallen auf die Homepage
-- zurueck -> keine Provision. Siehe audits/orphan-slugs-triage.md.
--
-- DIESE MIGRATION IST EIN SCAFFOLD — NICHT BLIND AUSFUEHREN.
--
-- TODO (Inhaber / spaetere Session) VOR dem live-Schalten:
--   1. destination_url 'https://REPLACE-WITH-AFFILIATE-URL/' durch die
--      ECHTE getrackte Affiliate-URL pro Partner ersetzen.
--   2. active = false  ->  active = true  setzen (erst NACH korrekter URL!).
--   3. commission_type ('cpa' als Default) und commission_value (0 als Default)
--      an die tatsaechlichen Programm-Konditionen anpassen.
--   4. Block 2 (UPDATE): die dort gelisteten Slugs existieren bereits in der DB
--      mit active=false und health_status='dead'. Erst die URL fixen, dann
--      active=true setzen.
--
-- Nur Gruppe-A-Partner aus audits/orphan-slugs-triage.md sind hier enthalten.
-- Gruppe B (nicht monetarisierbar) und Gruppe C (unklar) bleiben absichtlich
-- AUSSEN VOR und werden separat im MDX zu Klartext umgebaut.
-- ============================================================


-- ─────────────────────────────────────────────────────────────────────────
-- BLOCK 1 — category-CHECK-Constraint erweitern
-- ─────────────────────────────────────────────────────────────────────────
-- Einige Gruppe-A-Partner stammen aus Content-Kategorien, die die aktuelle
-- CHECK-Constraint NICHT erlaubt: superannuation, savings, housing.
-- (Ohne diese Erweiterung schlaegt jeder INSERT mit diesen Kategorien fehl.)
--
-- Aktuelle Constraint (aus supabase/schema.sql, Zeile 21) ist eine inline
-- Spalten-CHECK ohne expliziten Namen -> Postgres vergibt automatisch
-- 'affiliate_links_category_check'. Wir droppen sie und legen sie mit dem
-- erweiterten Wertebereich neu an.

ALTER TABLE affiliate_links
  DROP CONSTRAINT IF EXISTS affiliate_links_category_check;

ALTER TABLE affiliate_links
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
    'gold-investing',
    -- NEU fuer Gruppe-A-Orphans (Befund F-01):
    'superannuation',
    'savings',
    'housing'
  ));


-- ─────────────────────────────────────────────────────────────────────────
-- BLOCK 2 — Bereits vorhandene Slugs reaktivieren (UPDATE, NICHT INSERT)
-- ─────────────────────────────────────────────────────────────────────────
-- Diese Slugs existieren schon in affiliate_links mit active=false und
-- health_status='dead'. Ein INSERT ... ON CONFLICT DO NOTHING wuerde sie
-- stillschweigend ueberspringen. Sie brauchen ein UPDATE.
--
-- ACHTUNG: Hier wird BEWUSST NICHT active=true gesetzt — zuerst muss der
-- Inhaber die destination_url verifizieren/ersetzen. Diese UPDATE-Anweisung
-- ist auskommentiert und dient als Vorlage. Pro Slug einzeln aktivieren:
--
-- UPDATE affiliate_links
--   SET destination_url = 'https://REPLACE-WITH-AFFILIATE-URL/',
--       active          = true,
--       health_status   = 'unknown'
-- WHERE slug = 'revolut-business';   -- 33 refs (DB: market=uk; primär au genutzt)
--
-- Weitere reaktivierbare Slugs (jeweils URL pruefen, dann active=true):
--   questrade          (17 refs, ca, trading)
--   plus500            (12 refs, uk, trading)
--   plus500-au         ( 3 refs, au, trading)
--   plus500-uk         ( 1 ref,  uk, trading)
--   silvergoldbull-ca  ( 3 refs, ca, gold-investing)
--   silvergoldbull-us  ( 3 refs, us, gold-investing)
--   ally-invest-robo   ( 2 refs, us, personal-finance)


-- ─────────────────────────────────────────────────────────────────────────
-- BLOCK 3 — Neue Gruppe-A-Partner anlegen (INSERT, active=false)
-- ─────────────────────────────────────────────────────────────────────────
-- active=false + Platzhalter-URL: nichts geht mit falscher URL live.
-- ON CONFLICT (slug) DO NOTHING: idempotent, ueberspringt vorhandene Slugs.

INSERT INTO affiliate_links
  (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  -- ── superannuation / savings / housing (benoetigen Block-1-Erweiterung) ──
  ('australian-retirement-trust', 'Australian Retirement Trust', 'https://REPLACE-WITH-AFFILIATE-URL/', 'superannuation',   'au', 'cpa', 0, false),
  ('australian-super',            'AustralianSuper',             'https://REPLACE-WITH-AFFILIATE-URL/', 'superannuation',   'au', 'cpa', 0, false),
  ('hostplus',                    'Hostplus',                    'https://REPLACE-WITH-AFFILIATE-URL/', 'superannuation',   'au', 'cpa', 0, false),
  ('ubank',                       'uBank',                       'https://REPLACE-WITH-AFFILIATE-URL/', 'savings',          'au', 'cpa', 0, false),
  ('ing-savings',                 'ING Savings Maximiser',       'https://REPLACE-WITH-AFFILIATE-URL/', 'savings',          'au', 'cpa', 0, false),
  ('macquarie-savings',           'Macquarie Savings',           'https://REPLACE-WITH-AFFILIATE-URL/', 'savings',          'au', 'cpa', 0, false),
  ('chip',                        'Chip',                        'https://REPLACE-WITH-AFFILIATE-URL/', 'savings',          'uk', 'cpa', 0, false),
  ('raisin-uk',                   'Raisin UK',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'savings',          'uk', 'cpa', 0, false),
  ('nesto',                       'nesto',                       'https://REPLACE-WITH-AFFILIATE-URL/', 'housing',          'ca', 'cpa', 0, false),

  -- ── ai-tools ──
  ('copilot-money',               'Copilot Money',               'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),
  ('ynab',                        'YNAB',                        'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),
  ('monarch-money',               'Monarch Money',               'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),
  ('writesonic',                  'Writesonic',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),
  ('quickbooks-ai',               'QuickBooks AI',               'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),
  ('stripe-radar',                'Stripe Radar',                'https://REPLACE-WITH-AFFILIATE-URL/', 'ai-tools',         'us', 'cpa', 0, false),

  -- ── trading ──
  ('td-ameritrade',               'TD Ameritrade',               'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'us', 'cpa', 0, false),
  ('tastytrade',                  'tastytrade',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'us', 'cpa', 0, false),
  ('webull',                      'Webull',                      'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'us', 'cpa', 0, false),
  ('etrade',                      'E-TRADE',                     'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'us', 'cpa', 0, false),
  ('trading-212',                 'Trading 212',                 'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'uk', 'cpa', 0, false),
  ('freetrade',                   'Freetrade',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'uk', 'cpa', 0, false),
  ('etoro-uk',                    'eToro UK',                    'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'uk', 'cpa', 0, false),
  ('interactive-investor',        'interactive investor',        'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'uk', 'cpa', 0, false),
  ('etoro-au',                    'eToro AU',                    'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'au', 'cpa', 0, false),
  ('commsec',                     'CommSec',                     'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'au', 'cpa', 0, false),
  ('superhero',                   'Superhero',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'au', 'cpa', 0, false),
  ('td-direct',                   'TD Direct Investing',         'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'ca', 'cpa', 0, false),
  ('rbc-direct',                  'RBC Direct Investing',        'https://REPLACE-WITH-AFFILIATE-URL/', 'trading',          'ca', 'cpa', 0, false),

  -- ── forex ──
  ('tastyfx',                     'tastyfx',                     'https://REPLACE-WITH-AFFILIATE-URL/', 'forex',            'us', 'cpa', 0, false),

  -- ── personal-finance ──
  ('sofi',                        'SoFi',                        'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('amex-gold',                   'American Express Gold Card',  'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('chase-sapphire-preferred',    'Chase Sapphire Preferred',    'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('chase-sapphire-reserve',      'Chase Sapphire Reserve',      'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('empower',                     'Empower',                     'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('lightstream',                 'LightStream',                 'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('upstart',                     'Upstart',                     'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('discover-personal-loans',     'Discover Personal Loans',     'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('marcus',                      'Marcus by Goldman Sachs',     'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'us', 'cpa', 0, false),
  ('barclays-personal-loan',      'Barclays Personal Loan',      'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('hsbc-personal-loan',          'HSBC Personal Loan',          'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('lending-works',               'Lending Works',               'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('monzo',                       'Monzo',                       'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('nutmeg',                      'Nutmeg',                      'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('moneyfarm',                   'Moneyfarm',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('aj-bell-isa',                 'AJ Bell ISA',                 'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('fidelity-isa',                'Fidelity ISA',                'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('nutmeg-isa',                  'Nutmeg ISA',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('trading-212-isa',             'Trading 212 ISA',             'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('vanguard-isa',                'Vanguard ISA',                'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'uk', 'cpa', 0, false),
  ('commbank-home-loan',          'CommBank Home Loan',          'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('westpac-home-loan',           'Westpac Home Loan',           'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('nab-home-loan',               'NAB Home Loan',               'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('ubank-home-loan',             'uBank Home Loan',             'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('anz-home-loan',               'ANZ Home Loan',               'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('spaceship',                   'Spaceship',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('raiz',                        'Raiz',                        'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('vanguard-au',                 'Vanguard AU',                 'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'au', 'cpa', 0, false),
  ('cibc-personal-loans',         'CIBC Personal Loans',         'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'ca', 'cpa', 0, false),
  ('td-personal-loans',           'TD Personal Loans',           'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'ca', 'cpa', 0, false),
  ('tangerine',                   'Tangerine',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'ca', 'cpa', 0, false),
  ('neo-financial',               'Neo Financial',               'https://REPLACE-WITH-AFFILIATE-URL/', 'personal-finance', 'ca', 'cpa', 0, false),

  -- ── business-banking ──
  ('bluevine',                    'Bluevine',                    'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'us', 'cpa', 0, false),
  ('rho',                         'Rho',                         'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'us', 'cpa', 0, false),
  ('brex',                        'Brex',                        'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'us', 'cpa', 0, false),
  ('barclays-business',           'Barclays Business',           'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'uk', 'cpa', 0, false),
  ('mettle',                      'Mettle',                      'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'uk', 'cpa', 0, false),
  ('airwallex',                   'Airwallex',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'au', 'cpa', 0, false),
  ('rbc-business',                'RBC Business',                'https://REPLACE-WITH-AFFILIATE-URL/', 'business-banking', 'ca', 'cpa', 0, false),

  -- ── cybersecurity ──
  ('sentinelone',                 'SentinelOne',                 'https://REPLACE-WITH-AFFILIATE-URL/', 'cybersecurity',    'us', 'cpa', 0, false),
  ('expressvpn',                  'ExpressVPN',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'cybersecurity',    'us', 'cpa', 0, false),
  ('surfshark',                   'Surfshark',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'cybersecurity',    'us', 'cpa', 0, false),
  ('cisco-anyconnect',            'Cisco AnyConnect',            'https://REPLACE-WITH-AFFILIATE-URL/', 'cybersecurity',    'us', 'cpa', 0, false),

  -- ── gold-investing ──
  ('goldco',                      'Goldco',                      'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'us', 'cpa', 0, false),
  ('augusta',                     'Augusta Precious Metals',     'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'us', 'cpa', 0, false),
  ('birch-gold',                  'Birch Gold',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'us', 'cpa', 0, false),
  ('apmex',                       'APMEX',                       'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'us', 'cpa', 0, false),
  ('jm-bullion',                  'JM Bullion',                  'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'us', 'cpa', 0, false),
  ('ainslie-bullion',            'Ainslie Bullion',             'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'au', 'cpa', 0, false),
  ('perth-mint',                  'The Perth Mint',              'https://REPLACE-WITH-AFFILIATE-URL/', 'gold-investing',   'au', 'cpa', 0, false),

  -- ── credit-repair / credit-score ──
  ('lexington-law',               'Lexington Law',               'https://REPLACE-WITH-AFFILIATE-URL/', 'credit-repair',    'us', 'cpa', 0, false),
  ('credit-saint',                'Credit Saint',                'https://REPLACE-WITH-AFFILIATE-URL/', 'credit-repair',    'us', 'cpa', 0, false),
  ('borrowell',                   'Borrowell',                   'https://REPLACE-WITH-AFFILIATE-URL/', 'credit-score',     'ca', 'cpa', 0, false)

ON CONFLICT (slug) DO NOTHING;
