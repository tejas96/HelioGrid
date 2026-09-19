import { describe, expect, it } from 'vitest';
import { channelsOwed, mayMute, pushMuted } from '../../src/notifications/mutes';
import { typeGroupOf } from '../../src/notifications/registry';
import { NOTIFICATION_TYPE_GROUPS, NOTIFICATION_TYPES } from '../../src/notifications/types';

/**
 * `F6-15` — a person may mute PUSH per type-group. Never the record, which always lands
 * (`F6-06`), and never the billing group for a holder of the EPC Owner preset, whose rows are
 * the audit-relevant ones the law names.
 */
const OWNER = ['epc_owner'] as const;
const REP = ['sales_executive'] as const;

describe('mayMute — which groups a person may switch off (F6-15)', () => {
  it('lets anyone mute every group but billing, and the Owner mute every group but billing', () => {
    const others = NOTIFICATION_TYPE_GROUPS.filter((group) => group !== 'billing');
    expect(others.every((group) => mayMute(group, REP))).toBe(true);
    expect(others.every((group) => mayMute(group, OWNER))).toBe(true);
  });

  it('refuses the billing group to a holder of the EPC Owner preset, and to nobody else', () => {
    expect(mayMute('billing', OWNER)).toBe(false);
    expect(mayMute('billing', REP)).toBe(true);
    expect(mayMute('billing', ['sales_manager', 'epc_owner'])).toBe(false);
    expect(mayMute('billing', [])).toBe(true);
  });
});

describe('pushMuted — whether a stored mute stands when the push resolves (F6-15)', () => {
  it('stands for a group the person muted, and not for one they did not', () => {
    expect(pushMuted('sales', ['sales'], REP)).toBe(true);
    expect(pushMuted('delivery', ['sales'], REP)).toBe(false);
    expect(pushMuted('sales', [], REP)).toBe(false);
  });

  it('is DISREGARDED for billing when the reader holds the Owner preset, however it was stored', () => {
    // The row can exist: a person mutes billing, and is made Owner afterwards.
    expect(pushMuted('billing', ['billing'], REP)).toBe(true);
    expect(pushMuted('billing', ['billing'], OWNER)).toBe(false);
  });
});

describe('channelsOwed — what a muted type still delivers (F6-11, F6-15)', () => {
  it('leaves an unmuted type with the channels its registration names', () => {
    expect(channelsOwed('proposal_opened', [], REP)).toEqual(['in_app', 'push']);
  });

  it('drops push for a muted group and KEEPS the record — never an empty set', () => {
    expect(channelsOwed('proposal_opened', ['sales'], REP)).toEqual(['in_app']);
  });

  it('leaves a type whose group is not muted alone', () => {
    expect(channelsOwed('proposal_opened', ['delivery', 'team'], REP)).toEqual(['in_app', 'push']);
  });

  it('still answers in_app for a type that never pushed', () => {
    expect(channelsOwed('follow_up_due', [], REP)).toEqual(['in_app']);
    expect(channelsOwed('follow_up_due', ['sales'], REP)).toEqual(['in_app']);
  });

  it('gives every registered type at least the record, muted or not', () => {
    for (const group of NOTIFICATION_TYPE_GROUPS) {
      expect(channelsOwed('system', [group], REP)).toContain('in_app');
    }
  });
});

describe('typeGroupOf — every type reaches a group, and none falls through (F6-15)', () => {
  /**
   * WHAT THIS DOES NOT HOLD: that a source is assigned to the RIGHT group. Both sides are
   * strings and no type can tell them apart, so the assignment stands exactly where `raisedBy`,
   * `recipients` and `channels` already stand — a registration read off `F6.3`'s matrix and held
   * by review. Said here rather than left to look covered.
   */
  it('reaches every group the matrix raises today, and leaves billing to the slice that raises it', () => {
    /* Mapping EVERY registered type is the totality check too: a type with no group would answer
       undefined and show up in this set. */
    const reached = new Set(NOTIFICATION_TYPES.map(typeGroupOf));
    expect([...reached].sort()).toEqual(['delivery', 'payments', 'sales', 'team']);
    expect(reached.has('billing')).toBe(false);
  });
});
