import { describe, expect, it } from 'vitest';
import { CHECKLIST, emptyPlan, planSummary, progress, waterGallons, type Plan } from './plan';

const labels = {
  title: 'Our plan',
  meeting: { nearHome: 'Near home', outsideNeighborhood: 'Outside', highGround: 'High ground' },
  contacts: 'Contacts',
  notes: 'Notes',
};

describe('waterGallons', () => {
  it('is 1 gallon per person per day for 14 days', () => {
    expect(waterGallons(1)).toBe(14);
    expect(waterGallons(4)).toBe(56);
    expect(waterGallons(0)).toBe(0);
    expect(waterGallons(-2)).toBe(0);
    expect(waterGallons(2.7)).toBe(28);
  });
});

describe('progress', () => {
  it('counts checked items', () => {
    const plan: Plan = {
      ...emptyPlan(),
      checklist: { kitWater: true, kitFood: false, kitCash: true },
    };
    expect(progress(plan)).toEqual({ done: 2, total: CHECKLIST.length });
  });
});

describe('planSummary', () => {
  it('includes only filled-in sections, trimmed', () => {
    const plan: Plan = {
      ...emptyPlan(),
      meetingPoints: { nearHome: '  Mailbox ', highGround: '' },
      contacts: [
        { id: '1', name: 'Auntie', phone: '808-555-0100', relation: 'Maui' },
        { id: '2', name: ' ', phone: ' ', relation: '' },
        { id: '3', name: 'Kai', phone: '', relation: '' },
      ],
      notes: '',
    };
    expect(planSummary(plan, labels)).toBe(
      ['Our plan', 'Near home: Mailbox', 'Contacts:', 'Auntie (Maui) 808-555-0100', 'Kai'].join(
        '\n',
      ),
    );
  });

  it('is just the title for an empty plan', () => {
    expect(planSummary(emptyPlan(), labels)).toBe('Our plan');
  });
});
