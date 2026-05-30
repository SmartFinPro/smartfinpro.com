-- Migration: Add top orphan affiliate slugs referenced in MDX content but missing in DB
-- Date: 2026-05-25
-- Reason: Audit found 130+ /go/<slug> references in content with no matching affiliate_links row.
--         These cause broken CTAs / dead redirect links for readers.
--         Top 15 by reference count added here with official product URLs.
--         commission_value = 0 until real tracked affiliate URLs are configured per program.
--         Replace destination_url values with tracked affiliate links once credentials are set up.

INSERT INTO affiliate_links (slug, partner_name, destination_url, category, market, commission_type, commission_value, active)
VALUES
  -- crowdstrike: 33 refs — cybersecurity (US, AU, CA, UK)
  ('crowdstrike',          'CrowdStrike',             'https://www.crowdstrike.com/',                        'cybersecurity',    'us', 'cpa', 0,   true),
  ('crowdstrike-au',       'CrowdStrike',             'https://www.crowdstrike.com/en-au/',                  'cybersecurity',    'au', 'cpa', 0,   true),
  ('crowdstrike-ca',       'CrowdStrike',             'https://www.crowdstrike.com/',                        'cybersecurity',    'ca', 'cpa', 0,   true),
  ('crowdstrike-uk',       'CrowdStrike',             'https://www.crowdstrike.com/en-gb/',                  'cybersecurity',    'uk', 'cpa', 0,   true),

  -- copy-ai: 23 refs — ai-tools (US, AU, CA, UK)
  ('copy-ai',              'Copy.ai',                 'https://www.copy.ai/',                                'ai-tools',         'us', 'cpa', 0,   true),

  -- forex-com: 15 refs — forex (US, CA)
  ('forex-com',            'FOREX.com',               'https://www.forex.com/en-us/',                        'forex',            'us', 'cpa', 0,   true),
  ('forex-com-ca',         'FOREX.com',               'https://www.forex.com/en-ca/',                        'forex',            'ca', 'cpa', 0,   true),

  -- marcus-uk: 15 refs — personal-finance / savings (UK)
  ('marcus-uk',            'Marcus by Goldman Sachs', 'https://www.marcus.co.uk/',                           'personal-finance', 'uk', 'cpa', 0,   true),

  -- eq-bank: 14 refs — business-banking / personal-finance (CA)
  ('eq-bank',              'EQ Bank',                 'https://www.eqbank.ca/',                              'personal-finance', 'ca', 'cpa', 0,   true),

  -- pepperstone: 12 refs — forex (AU, UK)
  ('pepperstone',          'Pepperstone',             'https://pepperstone.com/en-au/',                      'forex',            'au', 'cpa', 0,   true),
  ('pepperstone-uk',       'Pepperstone',             'https://pepperstone.com/en-gb/',                      'forex',            'uk', 'cpa', 0,   true),

  -- habito: 12 refs — remortgaging (UK)
  ('habito',               'Habito',                  'https://www.habito.com/',                             'personal-finance', 'uk', 'cpa', 0,   true),

  -- proofpoint: 12 refs — cybersecurity (US, AU, CA, UK)
  ('proofpoint',           'Proofpoint',              'https://www.proofpoint.com/us',                       'cybersecurity',    'us', 'cpa', 0,   true),

  -- selfwealth: 10 refs — trading / personal-finance (AU)
  ('selfwealth',           'SelfWealth',              'https://www.selfwealth.com.au/',                      'trading',          'au', 'cpa', 0,   true),

  -- starling-business: 10 refs — business-banking (UK)
  ('starling-business',    'Starling Bank Business',  'https://www.starlingbank.com/business/',              'business-banking', 'uk', 'cpa', 0,   true),

  -- national-debt-relief: 10 refs — debt-relief (US)
  ('national-debt-relief', 'National Debt Relief',    'https://www.nationaldebtrelief.com/',                 'personal-finance', 'us', 'cpa', 0,   true),

  -- hargreaves-lansdown: 9 refs — trading (UK)
  ('hargreaves-lansdown',  'Hargreaves Lansdown',     'https://www.hl.co.uk/',                               'trading',          'uk', 'cpa', 0,   true),

  -- charles-schwab: 9 refs — trading (US)
  ('charles-schwab',       'Charles Schwab',          'https://www.schwab.com/',                             'trading',          'us', 'cpa', 0,   true),

  -- robinhood: 9 refs — trading (US)
  ('robinhood',            'Robinhood',               'https://robinhood.com/',                              'trading',          'us', 'cpa', 0,   true),

  -- fidelity: 10 refs — trading / personal-finance (US)
  ('fidelity',             'Fidelity',                'https://www.fidelity.com/',                           'trading',          'us', 'cpa', 0,   true),

  -- sofi-personal-loans: 10 refs — personal-finance (US)
  ('sofi-personal-loans',  'SoFi Personal Loans',     'https://www.sofi.com/personal-loans/',                'personal-finance', 'us', 'cpa', 0,   true),

  -- ratehub: 9 refs — housing (CA)
  ('ratehub',              'Ratehub',                 'https://www.ratehub.ca/',                             'personal-finance', 'ca', 'cpa', 0,   true),

  -- hargreaves-lansdown ISA: 9 refs (uk personal-finance)
  ('hl-isa',               'Hargreaves Lansdown ISA', 'https://www.hl.co.uk/investments/isa',                'personal-finance', 'uk', 'cpa', 0,   true),

  -- zopa-personal-loans: 9 refs (uk personal-finance)
  ('zopa-personal-loans',  'Zopa',                    'https://www.zopa.com/personal-loans',                 'personal-finance', 'uk', 'cpa', 0,   true)

ON CONFLICT (slug) DO NOTHING;
