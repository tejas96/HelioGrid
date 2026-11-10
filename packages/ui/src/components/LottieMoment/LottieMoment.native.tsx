import LottieView, { type AnimationObject } from 'lottie-react-native';
import { View } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import type { LottieMomentName, LottieMomentProps } from './LottieMoment.types';
import celebrate from './moments/celebrate.json';
import plan from './moments/plan.json';
import published from './moments/published.json';
import saved from './moments/saved.json';
import sent from './moments/sent.json';
import success from './moments/success.json';
import sunrise from './moments/sunrise.json';

/* Metro cannot lazy-load (`apps/mobile/CLAUDE.md`), so the moments ship in the bundle: each is
   under 20 KB, with no image inside. */
const MOMENTS: Readonly<Record<LottieMomentName, AnimationObject>> = {
  success: success as AnimationObject,
  saved: saved as AnimationObject,
  celebrate: celebrate as AnimationObject,
  sunrise: sunrise as AnimationObject,
  published: published as AnimationObject,
  sent: sent as AnimationObject,
  plan: plan as AnimationObject,
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
        /* Reduced motion: a moment shows how it ends. */
        progress={reduced ? 1 : undefined}
        style={box}
      />
    </View>
  );
}
