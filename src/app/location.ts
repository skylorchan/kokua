import { createContext, useContext } from 'react';
import type { Position } from '../geo/types';

export type UserLocation = {
  position: Position;
  source: 'gps' | 'manual' | 'map';
  accuracyM?: number;
};

type LocationState = {
  location: UserLocation | null;
  setLocation: (location: UserLocation | null) => void;
};

export const LocationContext = createContext<LocationState | null>(null);

/** The location the user last chose, shared by the Zone and Safe places screens. */
export function useLocation(): LocationState {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useLocation must be used inside <LocationProvider>');
  return value;
}
