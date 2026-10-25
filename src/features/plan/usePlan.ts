import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../../data/db';
import { emptyPlan, type Plan } from './plan';

/** Loads the plan from IndexedDB and saves every change straight back. */
export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef<Plan | null>(null);

  useEffect(() => {
    let active = true;
    db.plan
      .get('household')
      .catch(() => undefined)
      .then((saved) => {
        if (!active) return;
        const loaded = { ...emptyPlan(), ...saved };
        latest.current = loaded;
        setPlan(loaded);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((change: (p: Plan) => Plan) => {
    if (!latest.current) return;
    const next = { ...change(latest.current), updatedAt: new Date().toISOString() };
    latest.current = next;
    setPlan(next);
    db.plan.put(next).then(
      () => setSaveFailed(false),
      () => setSaveFailed(true), // e.g. private browsing with storage disabled
    );
  }, []);

  return { plan, update, saveFailed };
}
