import { useMemo, useState, type ReactNode } from 'react';
import { LocationContext, type UserLocation } from './location';

// Kept in memory only: a location is personal, so it is never written to storage.
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const value = useMemo(() => ({ location, setLocation }), [location]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}
