// Lets the axios layer (outside the React tree) tell UserContext to log
// out immediately when the backend rejects the current token as invalid.
type Listener = () => void;

const listeners = new Set<Listener>();

export const onUnauthorized = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitUnauthorized = (): void => {
  listeners.forEach(listener => listener());
};
