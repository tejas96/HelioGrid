import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';

/**
 * Whether an ambient loop may run now: the person has not asked for reduced motion (which Android
 * also reports when the animator scale is 0, as CI's emulator sets it) and the app is in front.
 * The phone takes no ref: a screen that leaves unmounts its loops.
 */
export function useAmbientRun(): boolean {
  const reduced = useReducedMotion();
  const [front, setFront] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setFront(state === 'active'));
    return () => sub.remove();
  }, []);
  return !reduced && front;
}
