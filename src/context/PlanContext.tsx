import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {AppState} from 'react-native';
import PlanService from '../services/PlanService';
import {FeatureKey, IUsage} from '../../interface/plan.interface';
import {useUserContext} from './UserContext';
import {onPlanLimit, PlanLimitInfo} from '../utils/planEvents';
import {onDataChanged} from '../utils/dataVersion';
import {connectPurchases, disconnectPurchases} from '../services/purchases';
import {track} from '../services/analytics';

interface IPlanContext {
  // null until first loaded (or signed out)
  usage: IUsage | null;
  refresh: () => Promise<void>;
  // After a purchase or restore: ask the server to check with RevenueCat
  syncPurchases: () => Promise<IUsage>;
  // Quick check before an action: false (and the upgrade sheet opens) when
  // the plan clearly doesn't allow it. The server still decides; this
  // just saves a wasted step. Always true while limits aren't enforced.
  gate: (feature: FeatureKey) => boolean;
  // What the upgrade sheet is showing; null = closed
  upgrade: PlanLimitInfo | null;
  showUpgrade: (info: PlanLimitInfo) => void;
  closeUpgrade: () => void;
}

const PlanContext = createContext<IPlanContext | undefined>(undefined);

// Data that changes usage counts when written.
const COUNTED = ['rooms', 'designs', 'notes', 'moodboard'];

export const PlanProvider = ({children}: {children: React.ReactNode}) => {
  const {user} = useUserContext();
  const signedIn = !!user;
  const [usage, setUsage] = useState<IUsage | null>(null);
  const [upgrade, setUpgrade] = useState<PlanLimitInfo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      return;
    }
    try {
      setUsage(await PlanService.getUsage());
    } catch {
      // Keep what we had; the server enforces limits anyway.
    }
  }, [signedIn]);

  const syncPurchases = useCallback(async () => {
    const next = await PlanService.syncPurchases();
    setUsage(next);
    return next;
  }, []);

  // Purchases belong to the signed-in account.
  const appUserId = usage?.app_user_id;
  useEffect(() => {
    if (appUserId) {
      connectPurchases(appUserId);
    }
  }, [appUserId]);

  // Load on sign-in, clear on sign-out, and refresh when the app comes
  // back to the foreground.
  useEffect(() => {
    if (!signedIn) {
      setUsage(null);
      disconnectPurchases();
      return;
    }
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [signedIn, refresh]);

  // After a save or delete, refresh the counts (once, if several land
  // together).
  useEffect(
    () =>
      onDataChanged(keys => {
        if (!keys.some(k => COUNTED.includes(k))) {
          return;
        }
        if (timer.current) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(refresh, 400);
      }),
    [refresh],
  );

  // The server refused something because of the plan.
  useEffect(
    () =>
      onPlanLimit(info => {
        setUpgrade(info);
        track.limitHit(info.feature ?? info.code);
        refresh();
      }),
    [refresh],
  );

  const gate = useCallback(
    (feature: FeatureKey) => {
      const f = usage?.features[feature];
      if (!usage?.enforced || !f || f.allowed) {
        return true;
      }
      track.limitHit(feature);
      setUpgrade({
        code: 'PLAN_LIMIT_REACHED',
        feature,
        plan: usage.plan,
        used: f.used,
        limit: f.limit,
      });
      return false;
    },
    [usage],
  );

  return (
    <PlanContext.Provider
      value={{
        usage,
        refresh,
        syncPurchases,
        gate,
        upgrade,
        showUpgrade: setUpgrade,
        closeUpgrade: () => setUpgrade(null),
      }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used inside PlanProvider');
  }
  return context;
};
