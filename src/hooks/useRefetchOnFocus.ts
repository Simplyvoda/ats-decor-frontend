import {useCallback, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {DataKey, getDataVersion} from '../utils/dataVersion';

// Runs `fetch` when the screen gains focus — but only if the data it shows
// was written to since the last fetch (see dataVersion), or the last fetch
// is older than `maxAgeMs`. Returning to a screen where nothing changed
// reuses what is already on it instead of reloading from the server.
//
// `fetch` should resolve to false when it failed, so the next focus tries
// again instead of treating the failed attempt as fresh data.
export default function useRefetchOnFocus(
  fetch: () => Promise<boolean | void>,
  keys: DataKey[],
  maxAgeMs: number,
) {
  const last = useRef<{at: number; version: string} | null>(null);
  const keyList = keys.join(',');

  useFocusEffect(
    useCallback(() => {
      const version = getDataVersion(keyList.split(',') as DataKey[]);
      const now = Date.now();
      if (
        last.current &&
        last.current.version === version &&
        now - last.current.at < maxAgeMs
      ) {
        return;
      }
      const attempt = {at: now, version};
      last.current = attempt;
      fetch().then(ok => {
        if (ok === false && last.current === attempt) {
          last.current = null;
        }
      });
    }, [fetch, keyList, maxAgeMs]),
  );
}
