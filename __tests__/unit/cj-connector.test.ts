import { describe, it, expect } from 'vitest';
import { CjConnector } from '@/lib/api/connectors/cj';

const baseRecord = {
  commissionId: 'CJ-123',
  sid: '619bf036-86ab-4ee5-8e98-3ad447c6826c',
  actionStatus: 'closed',
  actionType: 'sale',
  eventDate: '2026-06-27T10:00:00Z',
  postingDate: '2026-06-28T02:00:00Z',
  orderId: 'ORD-9',
  currency: 'CAD',
  pubCommissionAmountUsd: 9.12,
  advertiserName: 'Silver Gold Bull',
};

describe('CjConnector.toConversion — CJ commission → normalized ConversionData', () => {
  it('maps sid → click_id (so it matches link_clicks)', () => {
    const c = CjConnector.toConversion(baseRecord);
    expect(c.click_id).toBe(baseRecord.sid);
    expect(c.sub_id).toBe(baseRecord.sid);
  });

  it('uses commissionId as external_id (dedup key)', () => {
    expect(CjConnector.toConversion(baseRecord).external_id).toBe('CJ-123');
  });

  it('uses USD commission amount + currency USD (avoids FX drift)', () => {
    const c = CjConnector.toConversion(baseRecord);
    expect(c.amount).toBe(9.12);
    expect(c.currency).toBe('USD');
  });

  it('parses eventDate as converted_at', () => {
    expect(CjConnector.toConversion(baseRecord).converted_at.toISOString()).toBe('2026-06-27T10:00:00.000Z');
  });

  it('handles missing sid / amount gracefully', () => {
    const c = CjConnector.toConversion({ ...baseRecord, sid: null, pubCommissionAmountUsd: null });
    expect(c.click_id).toBeUndefined();
    expect(c.amount).toBe(0);
  });
});

describe('CjConnector.mapStatus — CJ actionStatus → pending/approved/rejected', () => {
  it('closed / locked → approved', () => {
    expect(CjConnector.mapStatus('closed', 10)).toBe('approved');
    expect(CjConnector.mapStatus('locked', 10)).toBe('approved');
  });

  it('new / extended → pending', () => {
    expect(CjConnector.mapStatus('new', 10)).toBe('pending');
    expect(CjConnector.mapStatus('extended', 10)).toBe('pending');
  });

  it('corrected or negative amount → rejected (reversal)', () => {
    expect(CjConnector.mapStatus('corrected', 10)).toBe('rejected');
    expect(CjConnector.mapStatus('closed', -10)).toBe('rejected');
  });
});
