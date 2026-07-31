import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Screen-local hook for LoginScreen (apps/mobile/CLAUDE.md §Local conventions — screen-folder satellites). */

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    // Rejection keeps the `false` default — motion stays on, which is the safe fallback.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduce(v);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return reduce;
}
