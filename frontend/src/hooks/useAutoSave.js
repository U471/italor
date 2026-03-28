import { useEffect, useRef } from 'react';
import { saveDesign } from '../services/design.service';

const AUTO_SAVE_DELAY = 30000; // 30 seconds

/**
 * Debounced auto-save hook for the suit builder.
 * When the user is authenticated and the config changes,
 * schedules a save 30 seconds after the last change.
 * Silently fails to avoid disrupting the user experience.
 *
 * @param {object} config  Current suit config from suitStore
 * @param {boolean} isAuthenticated  Whether the user is logged in
 */
export function useAutoSave(config, isAuthenticated) {
  const timerRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const configStr = JSON.stringify(config);
    if (configStr === lastSavedRef.current) return undefined;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveDesign({ suitConfig: config, name: '' }).then(() => {
        lastSavedRef.current = configStr;
      }).catch(() => {
        // silent fail for auto-save
      });
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [config, isAuthenticated]);
}
