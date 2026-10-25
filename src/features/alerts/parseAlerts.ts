// Turns an api.weather.gov /alerts response (GeoJSON, CAP fields) into the alerts the
// app shows. Anything malformed is dropped rather than crashing the screen.
// Field reference: https://www.weather.gov/documentation/services-web-api#/default/alerts_active

export type Severity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';

export type Alert = {
  id: string;
  event: string;
  headline: string | null;
  description: string;
  instruction: string | null;
  areaDesc: string;
  severity: Severity;
  urgency: string;
  certainty: string;
  sent: Date;
  onset: Date | null;
  expires: Date | null;
  ends: Date | null;
  senderName: string;
};

const SEVERITY_RANK: Record<Severity, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);

function date(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function severity(v: unknown): Severity {
  return typeof v === 'string' && v in SEVERITY_RANK ? (v as Severity) : 'Unknown';
}

function parseOne(feature: unknown): (Alert & { references: string[] }) | null {
  if (!isObject(feature) || !isObject(feature.properties)) return null;
  const p = feature.properties;
  // Test and exercise messages must never look like real alerts.
  if (p.status !== 'Actual') return null;
  if (p.messageType === 'Cancel') return null;
  const id = str(p.id) ?? str(feature.id);
  const event = str(p.event);
  const sent = date(p.sent);
  if (!id || !event || !sent) return null;
  const references = Array.isArray(p.references)
    ? p.references.flatMap((r) => (isObject(r) && str(r.identifier) ? [r.identifier as string] : []))
    : [];
  return {
    id,
    event,
    headline: str(p.headline),
    description: str(p.description) ?? '',
    instruction: str(p.instruction),
    areaDesc: str(p.areaDesc) ?? '',
    severity: severity(p.severity),
    urgency: str(p.urgency) ?? 'Unknown',
    certainty: str(p.certainty) ?? 'Unknown',
    sent,
    onset: date(p.onset) ?? date(p.effective),
    expires: date(p.expires),
    ends: date(p.ends),
    senderName: str(p.senderName) ?? 'National Weather Service',
    references,
  };
}

/**
 * Parses, drops test messages and cancellations, drops alerts that a newer alert in the
 * same response replaces (CAP "references"), and sorts most severe first, then newest.
 */
export function parseAlerts(json: unknown): Alert[] {
  if (!isObject(json) || !Array.isArray(json.features)) return [];
  const parsed = json.features.map(parseOne).filter((a) => a !== null);

  const byId = new Map(parsed.map((a) => [a.id, a]));
  const replaced = new Set(parsed.flatMap((a) => a.references));
  return [...byId.values()]
    .filter((a) => !replaced.has(a.id))
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.sent.getTime() - a.sent.getTime(),
    )
    .map(({ references: _references, ...alert }) => alert);
}
