// Lets the axios layer (outside the React tree) tell PlanContext that the
// server refused something because of the user's plan, so it can open the
// upgrade sheet wherever the user is.
export type PlanLimitInfo = {
  code: 'PLAN_LIMIT_REACHED' | 'ROOM_LOCKED';
  feature?: string;
  plan?: string;
  used?: number;
  limit?: number | null;
  message?: string;
};

type Listener = (info: PlanLimitInfo) => void;
const listeners = new Set<Listener>();

export const onPlanLimit = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitPlanLimit = (info: PlanLimitInfo): void => {
  listeners.forEach(listener => listener(info));
};
