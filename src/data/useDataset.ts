import { useEffect, useState } from 'react';
import type { PlaceCollection } from '../geo/nearest';
import type { ZoneCollection } from '../geo/zoneLookup';

type Datasets = { zones: ZoneCollection; places: PlaceCollection };
export type DatasetName = keyof Datasets;

export type DatasetState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

// One request per dataset per page load, shared by every screen. The service worker
// precaches these files, so after the first visit they load from the device.
const requests = new Map<DatasetName, Promise<unknown>>();

function load<K extends DatasetName>(name: K): Promise<Datasets[K]> {
  let request = requests.get(name);
  if (!request) {
    request = fetch(`${import.meta.env.BASE_URL}data/${name}.geojson`).then((res) => {
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
      return res.json();
    });
    request.catch(() => requests.delete(name)); // let a later visit retry
    requests.set(name, request);
  }
  return request as Promise<Datasets[K]>;
}

export function useDataset<K extends DatasetName>(name: K): DatasetState<Datasets[K]> {
  const [state, setState] = useState<DatasetState<Datasets[K]>>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    load(name).then(
      (data) => active && setState({ status: 'ready', data }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [name]);
  return state;
}

/** Test helper: forget cached requests. */
export function resetDatasetCache() {
  requests.clear();
}
