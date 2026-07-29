import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Screen-local hooks for LoginScreen (CLAUDE.md §Screen structure satellite). */

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduce(v);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return reduce;
}
