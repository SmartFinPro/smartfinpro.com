-- Migration: Attribution-Incident Dedupe pro Provider-Segment
-- Date: 2026-07-07
--
-- Der Watchdog aggregiert jetzt pro partner_name + market + category
-- (+ network) statt nur pro partner_name (P2-Review-Finding: Multi-Markt-
-- Provider wie NordVPN mit 8 Links über us/uk/ca/au vermischten Scores,
-- Conversion-Fenster und Incidents). Der Live-Incident-Dedupe muss der
-- neuen Identität folgen, sonst könnte der zweite Markt desselben
-- Providers nie einen eigenen Vorfall öffnen.
--
-- market/category sind nullable → COALESCE auf '', damit zwei Live-
-- Incidents mit NULL-Markt weiterhin kollidieren (Postgres behandelt
-- NULLs in Unique-Indexen als verschieden). network bleibt bewusst
-- außen vor: eine Netzwerk-Migration desselben Angebots darf keinen
-- doppelten Live-Vorfall erzeugen.
-- Idempotent: safe to re-run.

DROP INDEX IF EXISTS uq_attribution_incident_live;

CREATE UNIQUE INDEX IF NOT EXISTS uq_attribution_incident_live
  ON attribution_incidents (provider, COALESCE(market, ''), COALESCE(category, ''), incident_type)
  WHERE status IN ('open', 'confirmed');
