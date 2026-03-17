-- page_cta_partners: Maps content pages to affiliate link partners
-- Used by Content Hub dashboard for CTA partner assignment

CREATE TABLE IF NOT EXISTS page_cta_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  affiliate_link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (page_url, affiliate_link_id)
);

CREATE INDEX idx_pcp_page_url ON page_cta_partners (page_url);
CREATE INDEX idx_pcp_affiliate_link_id ON page_cta_partners (affiliate_link_id);

ALTER TABLE page_cta_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pcp_anon_read" ON page_cta_partners
  FOR SELECT TO anon USING (true);

CREATE POLICY "pcp_auth_read" ON page_cta_partners
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pcp_service_all" ON page_cta_partners
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
