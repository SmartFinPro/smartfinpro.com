-- ============================================================
-- Migration: Add placement + display_type to page_cta_partners
-- Allows per-partner configuration of WHERE (top/mid/bot) and
-- HOW (table/mini_quiz/single) CTAs appear on content pages.
-- ============================================================

-- placements: SMALLINT array — 1=Top(Oben), 2=Middle(Mitte), 3=Bottom(Unten)
-- Default {1,2,3} = all positions (backward-compatible for existing rows)
ALTER TABLE page_cta_partners
  ADD COLUMN IF NOT EXISTS placements SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3]::SMALLINT[];

-- display_type: how the CTA is rendered
-- 'table' = Tabellenübersicht, 'mini_quiz' = MiniQuiz, 'single' = Einzelanzeige
ALTER TABLE page_cta_partners
  ADD COLUMN IF NOT EXISTS display_type TEXT NOT NULL DEFAULT 'single';

-- Constraints
ALTER TABLE page_cta_partners
  ADD CONSTRAINT pcp_display_type_check
  CHECK (display_type IN ('table', 'mini_quiz', 'single'));

ALTER TABLE page_cta_partners
  ADD CONSTRAINT pcp_placements_check
  CHECK (placements <@ ARRAY[1,2,3]::SMALLINT[]);

-- GIN index for efficient array containment queries
CREATE INDEX IF NOT EXISTS idx_pcp_placements ON page_cta_partners USING GIN (placements);

-- Documentation
COMMENT ON COLUMN page_cta_partners.placements IS 'Page positions: 1=Top, 2=Middle, 3=Bottom';
COMMENT ON COLUMN page_cta_partners.display_type IS 'CTA display format: table, mini_quiz, single';
