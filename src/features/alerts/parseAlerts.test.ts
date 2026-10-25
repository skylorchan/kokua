import { describe, expect, it } from 'vitest';
import active from './fixtures/nws-active-HI.json';
import recent from './fixtures/nws-recent-HI.json';
import { parseAlerts } from './parseAlerts';

/** Builds a minimal alert feature. Test fixture only, not a real alert. */
function fake(props: Record<string, unknown>) {
  return {
    type: 'Feature',
    geometry: null,
    properties: {
      id: 'urn:test:1',
      event: 'Test Event',
      status: 'Actual',
      messageType: 'Alert',
      severity: 'Moderate',
      sent: '2026-10-25T04:00:00-10:00',
      ...props,
    },
  };
}
const collection = (...features: unknown[]) => ({ type: 'FeatureCollection', features });

describe('parseAlerts with real NWS responses', () => {
  it('parses every alert in the captured active response', () => {
    const alerts = parseAlerts(active);
    expect(alerts).toHaveLength(active.features.length);
    const first = alerts[0]!;
    expect(first.event).toBe('Hydrologic Outlook');
    expect(first.senderName).toBe('NWS Honolulu HI');
    expect(first.areaDesc).toContain('Oahu');
    expect(first.severity).toBe('Unknown');
    expect(first.sent).toBeInstanceOf(Date);
    expect(first.expires!.getTime()).toBeGreaterThan(first.sent.getTime());
    expect(first.instruction).toBeNull();
  });

  it('parses the captured recent-alerts response without dropping real alerts', () => {
    expect(parseAlerts(recent)).toHaveLength(recent.features.length);
  });

  it('sorts newest first when severity ties', () => {
    const times = parseAlerts(recent).map((a) => a.sent.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe('parseAlerts edge cases', () => {
  it('drops test and exercise messages', () => {
    expect(parseAlerts(collection(fake({ status: 'Test' }), fake({ status: 'Exercise' })))).toEqual(
      [],
    );
  });

  it('drops cancellations', () => {
    expect(parseAlerts(collection(fake({ messageType: 'Cancel' })))).toEqual([]);
  });

  it('drops an alert that a newer one in the same response replaces', () => {
    const old = fake({ id: 'urn:test:old', sent: '2026-10-25T01:00:00-10:00' });
    const update = fake({
      id: 'urn:test:new',
      messageType: 'Update',
      references: [{ identifier: 'urn:test:old', sender: 'x', sent: '2026-10-25T01:00:00-10:00' }],
    });
    expect(parseAlerts(collection(old, update)).map((a) => a.id)).toEqual(['urn:test:new']);
  });

  it('puts the most severe alert first', () => {
    const alerts = parseAlerts(
      collection(
        fake({ id: 'a', severity: 'Minor', sent: '2026-10-25T05:00:00-10:00' }),
        fake({ id: 'b', severity: 'Extreme', sent: '2026-10-25T01:00:00-10:00' }),
        fake({ id: 'c', severity: 'Severe' }),
      ),
    );
    expect(alerts.map((a) => a.id)).toEqual(['b', 'c', 'a']);
  });

  it('skips malformed features instead of throwing', () => {
    const alerts = parseAlerts(
      collection(
        null,
        { properties: null },
        fake({ event: '' }),
        fake({ sent: 'not a date' }),
        fake({ id: 'ok' }),
      ),
    );
    expect(alerts.map((a) => a.id)).toEqual(['ok']);
  });

  it('treats an unknown severity as Unknown and a missing onset as the effective time', () => {
    const [a] = parseAlerts(
      collection(fake({ severity: 'Catastrophic', effective: '2026-10-25T06:00:00-10:00' })),
    );
    expect(a!.severity).toBe('Unknown');
    expect(a!.onset!.toISOString()).toBe('2026-10-25T16:00:00.000Z');
  });

  it('returns nothing for a non-GeoJSON body', () => {
    expect(parseAlerts(null)).toEqual([]);
    expect(parseAlerts({ features: 'nope' })).toEqual([]);
    expect(parseAlerts('<html>')).toEqual([]);
  });
});
