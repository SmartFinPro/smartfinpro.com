// __tests__/unit/firewall-plan.test.ts
import { describe, it, expect } from 'vitest';
import { buildFirewallPlan } from '@/app/(marketing)/us/business-banking/programmatic-financial-firewall/firewall-plan';

describe('buildFirewallPlan', () => {
  it('derives nodes from the selected stack in display order', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['saas', 'ads', 'hosting'], teamAccess: 'solo' });
    expect(p.nodes.map((n) => n.key)).toEqual(['ads', 'hosting', 'saas']); // ads, hosting, payroll, saas, contractors order
    expect(p.nodes.map((n) => n.label)).toEqual(['Ad Spend', 'Core Infrastructure', 'Team SaaS']);
  });

  it('normalizes weights over the selected nodes and rounds limits to the nearest 100', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads', 'hosting', 'saas'], teamAccess: 'solo' });
    expect(p.totalBudget).toBe(15000);
    expect(p.nodes.find((n) => n.key === 'ads')!.monthlyLimit).toBe(9100);
    expect(p.nodes.find((n) => n.key === 'hosting')!.monthlyLimit).toBe(4000);
    expect(p.nodes.find((n) => n.key === 'saas')!.monthlyLimit).toBe(1800);
    p.nodes.forEach((n) => expect(n.monthlyLimit % 100).toBe(0));
  });

  it('gives a single selected node ~the full budget', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: 'under-5k', stack: ['ads'], teamAccess: 'solo' });
    expect(p.nodes).toHaveLength(1);
    expect(p.nodes[0].monthlyLimit).toBe(4000);
  });

  it('supports all five nodes', () => {
    const p = buildFirewallPlan({ location: 'us', monthlySpend: '25k-plus', stack: ['ads', 'hosting', 'saas', 'payroll', 'contractors'], teamAccess: '2-5' });
    expect(p.nodes).toHaveLength(5);
    expect(p.headline).toBe('A 5-node cash-flow firewall');
  });

  it('applies the international modifier for non-US founders', () => {
    const us = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    const uk = buildFirewallPlan({ location: 'uk', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    expect(us.international).toBe(false);
    expect(uk.international).toBe(true);
    expect(uk.hardening.length).toBe(us.hardening.length + 1);
    expect(uk.hardening[uk.hardening.length - 1]).toMatch(/FIDO2 is mandatory/);
    expect(uk.subline).toMatch(/^International founder/);
    expect(us.subline).toMatch(/^US founder/);
  });

  it('scales hardening SOP by team size', () => {
    const solo = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' });
    const team = buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: '6-plus' });
    expect(solo.hardening).toHaveLength(2);
    expect(team.hardening).toHaveLength(4);
  });

  it('maps spend tiers to budgets and keeps the fixed CTA', () => {
    expect(buildFirewallPlan({ location: 'us', monthlySpend: 'under-5k', stack: ['ads'], teamAccess: 'solo' }).totalBudget).toBe(4000);
    expect(buildFirewallPlan({ location: 'us', monthlySpend: '25k-plus', stack: ['ads'], teamAccess: 'solo' }).totalBudget).toBe(40000);
    expect(buildFirewallPlan({ location: 'us', monthlySpend: '5k-25k', stack: ['ads'], teamAccess: 'solo' }).cta).toEqual({
      label: 'Launch Mercury and build this card map',
      href: '/go/mercury',
    });
  });
});
