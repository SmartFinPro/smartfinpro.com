-- ============================================================
-- Comparison Engine — product_attributes
-- ------------------------------------------------------------
-- Display- + Vergleichsdaten je Anbieter, keyed market×category.
-- Speist die wiederverwendbare Comparison Engine (/[category]/best).
-- BEWUSST getrennt von product_profiles (X-Ray-Score-Engine) — andere
-- Daten (Pro/Contra-Texte, Badges, Sub-Scores, Fee-Display, Verdict,
-- Chips, Card-Network, Apps) + andere Lebensdauer.
--
-- RLS: deny-all default; service_role ALL; anon/authenticated SELECT NUR
-- aktive Rows (inactive/gated Anbieter bleiben über die öffentliche
-- Supabase-API verborgen). Idempotent (CREATE … IF NOT EXISTS, DROP POLICY).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id  UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL, -- NULL = editorischer (Nicht-Affiliate) Anbieter
  slug               VARCHAR(100) NOT NULL,
  market             VARCHAR(4)   NOT NULL CHECK (market IN ('us','uk','ca','au')),
  category           VARCHAR(50)  NOT NULL,

  display_name       VARCHAR(120) NOT NULL,
  tagline            TEXT,
  logo_url           TEXT,
  verified           BOOLEAN NOT NULL DEFAULT true,

  -- Ranking-Inputs (feed cost + smartRank verbatim)
  score              DECIMAL(3,1)  NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),  -- editorial SmartFinPro-Score (Ranking)
  rating             DECIMAL(2,1)  NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5), -- Trustpilot-Star (Anzeige)
  review_count       INTEGER       NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  monthly_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  signup_bonus       DECIMAL(10,2) NOT NULL DEFAULT 0,
  fx_fee_pct         DECIMAL(5,2)  NOT NULL DEFAULT 0,  -- Prozent
  atm_fee            DECIMAL(10,2) NOT NULL DEFAULT 0,  -- pro Abhebung
  apy                DECIMAL(5,2)  NOT NULL DEFAULT 0,
  clicks             INTEGER       NOT NULL DEFAULT 0,  -- Popularität

  -- Display
  badges             JSONB  NOT NULL DEFAULT '[]'::jsonb,   -- [{type:'gold|green|sky', label}]
  chips              TEXT[] NOT NULL DEFAULT '{}',
  pros               TEXT[] NOT NULL DEFAULT '{}',
  cons               TEXT[] NOT NULL DEFAULT '{}',
  sub_scores         JSONB  NOT NULL DEFAULT '{"fees":0,"features":0,"ux":0,"support":0}'::jsonb,
  effective_apr      TEXT,
  cashback           TEXT,
  card_network       TEXT,
  wire_transfers     TEXT,
  fdic_coverage      TEXT,
  apps               JSONB  NOT NULL DEFAULT '[]'::jsonb,   -- ['apple','android','web']
  verdict            TEXT,

  -- Filter-Flags (gespeichert → billiger AND-Filter, identisch zu den Pills)
  has_no_monthly_fee BOOLEAN NOT NULL DEFAULT false,
  has_free_atm       BOOLEAN NOT NULL DEFAULT false,
  has_no_fx_fee      BOOLEAN NOT NULL DEFAULT false,
  has_cashback       BOOLEAN NOT NULL DEFAULT false,
  has_bonus          BOOLEAN NOT NULL DEFAULT false,
  has_sub_accounts   BOOLEAN NOT NULL DEFAULT false,
  has_interest       BOOLEAN NOT NULL DEFAULT false,
  has_apple_pay      BOOLEAN NOT NULL DEFAULT false,

  -- Matcher-Dimensionen (regelbasierter Scorer)
  entity_types           TEXT[] NOT NULL DEFAULT '{}',   -- {'llc','s-corp','c-corp','sole-prop'}
  supports_cash_deposits BOOLEAN NOT NULL DEFAULT false,
  supports_intl_wires    BOOLEAN NOT NULL DEFAULT false,
  has_bookkeeping        BOOLEAN NOT NULL DEFAULT false,
  has_lending            BOOLEAN NOT NULL DEFAULT false,
  integrations           TEXT[] NOT NULL DEFAULT '{}',   -- {'stripe','shopify','quickbooks'}

  -- CTA-Gating
  is_affiliate       BOOLEAN NOT NULL DEFAULT false,   -- true = monetisierter /go-Link
  review_slug        VARCHAR(100),                     -- interner Review (nur wenn MDX existiert, sonst 404)
  external_url       TEXT,                             -- 'Visit site' (non-affiliate, nofollow)

  -- Provenance (verifizierte Fakten — zeitkritisch)
  source_url         TEXT,
  data_verified_at   DATE,

  is_top_pick        BOOLEAN NOT NULL DEFAULT false,   -- pin #1 (z. B. Mercury)
  best_for           VARCHAR(60),
  display_order      INTEGER NOT NULL DEFAULT 100,
  active             BOOLEAN NOT NULL DEFAULT true,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (market, category, slug)
);

CREATE INDEX IF NOT EXISTS idx_pa_market_category ON public.product_attributes (market, category) WHERE active;
CREATE INDEX IF NOT EXISTS idx_pa_link            ON public.product_attributes (affiliate_link_id);

-- updated_at automatisch pflegen
CREATE OR REPLACE FUNCTION public.pa_set_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pa_updated_at ON public.product_attributes;
CREATE TRIGGER trg_pa_updated_at
  BEFORE UPDATE ON public.product_attributes
  FOR EACH ROW EXECUTE FUNCTION public.pa_set_updated_at();

-- RLS
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pa_service_role_all" ON public.product_attributes;
CREATE POLICY "pa_service_role_all" ON public.product_attributes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- nur aktive Rows öffentlich sichtbar (gated/inactive bleiben verborgen)
DROP POLICY IF EXISTS "pa_anon_read" ON public.product_attributes;
CREATE POLICY "pa_anon_read" ON public.product_attributes
  FOR SELECT TO anon USING (active = true);

DROP POLICY IF EXISTS "pa_authenticated_read" ON public.product_attributes;
CREATE POLICY "pa_authenticated_read" ON public.product_attributes
  FOR SELECT TO authenticated USING (active = true);

COMMENT ON TABLE public.product_attributes IS
  'Comparison Engine display/comparison data per provider, keyed market×category. Distinct from product_profiles (X-Ray scoring).';
