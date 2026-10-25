import Dexie, { type Table } from 'dexie';
import type { Plan } from '../features/plan/plan';

/** The last NWS alerts response we got, kept so alerts still show with no signal. */
export type CachedAlerts = { area: string; fetchedAt: string; body: string };

class KokuaDB extends Dexie {
  alerts!: Table<CachedAlerts, string>;
  plan!: Table<Plan, string>;

  constructor() {
    super('kokua');
    this.version(1).stores({ alerts: 'area', plan: 'id' });
  }
}

/** Everything personal lives here, on the device. Nothing is sent anywhere. */
export const db = new KokuaDB();
