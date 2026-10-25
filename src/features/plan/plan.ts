// The household emergency plan. Stored only on this device (IndexedDB).

/** Supply kit items. Quantities follow HI-EMA: 14 days of food, water, and medicine. */
export const CHECKLIST = [
  'kitWater',
  'kitFood',
  'kitMeds',
  'kitFirstAid',
  'kitRadio',
  'kitLight',
  'kitPower',
  'kitDocs',
  'kitCash',
  'kitPets',
  'kitKnowZone',
  'kitOutOfArea',
] as const;
export type ChecklistItem = (typeof CHECKLIST)[number];

export const MEETING_POINTS = ['nearHome', 'outsideNeighborhood', 'highGround'] as const;
export type MeetingPointKind = (typeof MEETING_POINTS)[number];

export type Contact = { id: string; name: string; phone: string; relation: string };

export type Plan = {
  id: 'household';
  people: number;
  checklist: Partial<Record<ChecklistItem, boolean>>;
  meetingPoints: Partial<Record<MeetingPointKind, string>>;
  contacts: Contact[];
  notes: string;
  updatedAt: string | null;
};

export const SUPPLY_DAYS = 14;

export function emptyPlan(): Plan {
  return {
    id: 'household',
    people: 1,
    checklist: {},
    meetingPoints: {},
    contacts: [],
    notes: '',
    updatedAt: null,
  };
}

/** Gallons of water for the household: 1 gallon per person per day (HI-EMA). */
export const waterGallons = (people: number) => Math.max(0, Math.floor(people)) * SUPPLY_DAYS;

export function progress(plan: Plan): { done: number; total: number } {
  return { done: CHECKLIST.filter((k) => plan.checklist[k]).length, total: CHECKLIST.length };
}

type Labels = {
  title: string;
  meeting: Record<MeetingPointKind, string>;
  contacts: string;
  notes: string;
};

/**
 * Plain-text summary for the QR code: what a family member needs if phones are dead or
 * the app isn't installed. Empty sections are left out to keep the code small.
 */
export function planSummary(plan: Plan, labels: Labels): string {
  const lines = [labels.title];
  for (const kind of MEETING_POINTS) {
    const place = plan.meetingPoints[kind]?.trim();
    if (place) lines.push(`${labels.meeting[kind]}: ${place}`);
  }
  const contacts = plan.contacts.filter((c) => c.name.trim() || c.phone.trim());
  if (contacts.length) {
    lines.push(`${labels.contacts}:`);
    for (const c of contacts) {
      const who = c.relation.trim() ? `${c.name.trim()} (${c.relation.trim()})` : c.name.trim();
      lines.push(`${who} ${c.phone.trim()}`.trim());
    }
  }
  if (plan.notes.trim()) lines.push(`${labels.notes}: ${plan.notes.trim()}`);
  return lines.join('\n');
}
