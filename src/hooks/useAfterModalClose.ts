import {useCallback, useRef} from 'react';
import {Platform} from 'react-native';

// On iOS, changing screens while a <Modal> is still on screen can fail: the
// new screen never appears, and the app can be left in a broken state. So
// hide the modal first, and change screens once it has gone.
//
//   const afterClose = useAfterModalClose();
//   <Modal visible={open} onDismiss={afterClose.onDismiss} … />
//   onPress={() => { setOpen(false); afterClose.run(() => navigate(…)); }}
export default function useAfterModalClose() {
  const pending = useRef<(() => void) | null>(null);

  const onDismiss = useCallback(() => {
    const action = pending.current;
    pending.current = null;
    action?.();
  }, []);

  const run = useCallback((action: () => void) => {
    if (Platform.OS === 'ios') {
      // iOS calls the modal's onDismiss once it has closed.
      pending.current = action;
    } else {
      setTimeout(action, 0);
    }
  }, []);

  return {run, onDismiss};
}
