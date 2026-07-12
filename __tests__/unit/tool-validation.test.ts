// __tests__/unit/tool-validation.test.ts
// tool_v1 Zod contract (lib/validation/index.ts additions) — strict sibling
// of the frozen cockpit_v1 schemas. Verifies TrackToolEventBatchSchema,
// TrackToolEventItemSchema and the additive TrackSchema.type enum entry.

import { describe, it, expect } from 'vitest';
import { TrackSchema, TrackToolEventBatchSchema } from '@/lib/validation';
import { TOOL_ID_VALUES } from '@/lib/tools/registry';

function toolItem(overrides: Record<string, unknown> = {}) {
  return {
    eventName: 'tool_view',
    eventCategory: 'tool',
    eventAction: 'view',
    eventLabel: 'money-leak-scanner',
    pagePath: '/tools/money-leak-scanner',
    properties: {
      schemaVersion: 'tool_v1',
      toolId: 'money-leak-scanner',
      market: 'us',
      variantPath: '/tools/money-leak-scanner',
      shellMode: 'live-canvas',
    },
    ...overrides,
  };
}

describe('TrackToolEventBatchSchema', () => {
  it('a valid 3-event batch parses', () => {
    const batch = [toolItem(), toolItem({ eventName: 'tool_start' }), toolItem({ eventName: 'tool_first_result' })];
    const result = TrackToolEventBatchSchema.safeParse(batch);
    expect(result.success).toBe(true);
  });

  it('an unknown property key is rejected (.strict())', () => {
    const batch = [toolItem({ properties: { ...toolItem().properties, foo: 1 } })];
    const result = TrackToolEventBatchSchema.safeParse(batch);
    expect(result.success).toBe(false);
  });

  it("eventCategory:'cockpit' inside a tool item is rejected", () => {
    const batch = [toolItem({ eventCategory: 'cockpit' })];
    const result = TrackToolEventBatchSchema.safeParse(batch);
    expect(result.success).toBe(false);
  });

  it('21 items is rejected', () => {
    const batch = Array.from({ length: 21 }, () => toolItem());
    expect(TrackToolEventBatchSchema.safeParse(batch).success).toBe(false);
  });

  it('0 items is rejected', () => {
    expect(TrackToolEventBatchSchema.safeParse([]).success).toBe(false);
  });

  it("TrackSchema accepts type: 'tool_event_batch'", () => {
    const result = TrackSchema.safeParse({
      type: 'tool_event_batch',
      sessionId: 'session-12345678',
      data: { events: [toolItem()] },
    });
    expect(result.success).toBe(true);
  });

  it("toolId:'nicht-existent' is rejected", () => {
    const batch = [toolItem({ properties: { ...toolItem().properties, toolId: 'nicht-existent' } })];
    expect(TrackToolEventBatchSchema.safeParse(batch).success).toBe(false);
  });

  it('every key from TOOL_ID_VALUES passes', () => {
    for (const toolId of TOOL_ID_VALUES) {
      const batch = [toolItem({ properties: { ...toolItem().properties, toolId } })];
      const result = TrackToolEventBatchSchema.safeParse(batch);
      expect(result.success, `toolId ${toolId} should pass`).toBe(true);
    }
  });

  it('a missing properties field is rejected (required, unlike cockpit)', () => {
    const item = toolItem();
    delete (item as Record<string, unknown>).properties;
    const result = TrackToolEventBatchSchema.safeParse([item]);
    expect(result.success).toBe(false);
  });
});
