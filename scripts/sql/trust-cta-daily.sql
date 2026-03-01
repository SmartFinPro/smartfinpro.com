-- Daily trust-to-CTA funnel report
-- Usage: run in Supabase SQL Editor
-- Window defaults to last 14 days.

with trust_views as (
  select
    date_trunc('day', occurred_at)::date as day,
    session_id,
    page_path,
    event_label as trust_block,
    properties ->> 'market' as market,
    coalesce(properties ->> 'category', '') as category
  from analytics_events
  where event_name = 'trust_block_view'
    and occurred_at >= now() - interval '14 days'
),
cta_clicks as (
  select
    date_trunc('day', occurred_at)::date as day,
    session_id,
    page_path,
    coalesce(properties ->> 'market', '') as market,
    coalesce(properties ->> 'category', '') as category,
    coalesce(properties ->> 'layout_variant', '') as layout_variant,
    coalesce(properties ->> 'placement', '') as placement
  from analytics_events
  where event_name = 'affiliate_cta_click'
    and occurred_at >= now() - interval '14 days'
),
sessions_with_trust as (
  select distinct
    day, session_id, page_path, market, category
  from trust_views
),
sessions_with_cta as (
  select distinct
    day, session_id, page_path, market, category
  from cta_clicks
),
joined as (
  select
    t.day,
    t.page_path,
    t.market,
    t.category,
    t.session_id,
    case when c.session_id is not null then 1 else 0 end as clicked_after_trust
  from sessions_with_trust t
  left join sessions_with_cta c
    on c.day = t.day
   and c.session_id = t.session_id
   and c.page_path = t.page_path
)
select
  day,
  page_path,
  market,
  category,
  count(distinct session_id) as sessions_with_trust_view,
  sum(clicked_after_trust) as sessions_with_cta_click,
  round(
    100.0 * sum(clicked_after_trust)::numeric / nullif(count(distinct session_id), 0),
    2
  ) as trust_to_cta_rate_pct
from joined
group by day, page_path, market, category
order by day desc, sessions_with_trust_view desc;

-- Optional breakdown by block / layout variant / placement:
-- select
--   date_trunc('day', t.occurred_at)::date as day,
--   t.event_label as trust_block,
--   c.properties ->> 'layout_variant' as layout_variant,
--   c.properties ->> 'placement' as placement,
--   count(distinct t.session_id) as trust_sessions,
--   count(distinct c.session_id) as cta_sessions
-- from analytics_events t
-- left join analytics_events c
--   on c.session_id = t.session_id
--  and c.page_path = t.page_path
--  and c.event_name = 'affiliate_cta_click'
--  and c.occurred_at >= t.occurred_at
-- where t.event_name = 'trust_block_view'
--   and t.occurred_at >= now() - interval '14 days'
-- group by 1,2,3,4
-- order by 1 desc, 5 desc;
