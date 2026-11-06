import LottieView, { type AnimationObject } from 'lottie-react-native';
import { View } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import type { LottieMomentName, LottieMomentProps } from './LottieMoment.types';
import celebrate from './moments/celebrate.json';
import empty from './moments/empty.json';
import success from './moments/success.json';

/* Metro cannot lazy-load (`apps/mobile/CLAUDE.md`), so the three moments ship in the bundle: each
   is under 10 KB, with no image inside. */
const MOMENTS: Readonly<Record<LottieMomentName, AnimationObject>> = {
  success: success as AnimationObject,
  celebrate: celebrate as AnimationObject,
  empty: empty as AnimationObject,
};

export function LottieMoment({ name, size, label }: LottieMomentProps) {
  const reduced = useReducedMotion();
  const box = { width: size, height: size };
  return (
    <View
      style={box}
      accessible={label !== undefined}
      accessibilityRole={label === undefined ? undefined : 'image'}
      accessibilityLabel={label}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    >
      <LottieView
        source={MOMENTS[name]}
        autoPlay={!reduced}
        loop={false}
        progress={reduced ? 1 : undefined}
        style={box}
      />
    </View>
  );
}
