import { EASING, theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { colors } from '../../primitives/Color/colors';
import { useReducedMotion } from '../../primitives/use-reduced-motion';
import { GlyphMarkList } from '../AppShell/ShellGlyphMarks.native';
import { PACES, SCENE_BOX, SCENE_SCALE, SCENES, type SceneLayer } from './EmptyScene.shapes';
import type { EmptySceneProps, EmptySceneSize } from './EmptyScene.types';

/**
 * The scene, in the quiet text colour. Each layer is its own drawing on a view that moves in once
 * and rests — transform and opacity on the native driver; under reduced motion it is at rest at
 * once.
 */
export function EmptyScene({ name, size = 'regular' }: EmptySceneProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles[size]}
    >
      {SCENES[name].map((layer) => (
        <SceneLayerView key={`${layer.pace}-${layer.step}`} layer={layer} size={size} />
      ))}
    </View>
  );
}

function SceneLayerView({ layer, size }: { layer: SceneLayer; size: EmptySceneSize }) {
  const scale = SCENE_SCALE[size];
  const reduce = useReducedMotion();
  const arrived = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const pace = PACES[layer.pace];
  useEffect(() => {
    if (reduce) {
      arrived.setValue(1);
      return;
    }
    const [x1, y1, x2, y2] = EASING[pace.easing];
    const entry = Animated.timing(arrived, {
      toValue: 1,
      duration: theme.motion.durations[pace.duration],
      delay: theme.motion.durations.standard * layer.step,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: true,
    });
    entry.start();
    return () => entry.stop();
  }, [arrived, layer.step, pace, reduce]);
  const moving = {
    opacity: arrived,
    transform: [
      {
        translateX: arrived.interpolate({
          inputRange: [0, 1],
          outputRange: [pace.from.x * scale, 0],
        }),
      },
      {
        translateY: arrived.interpolate({
          inputRange: [0, 1],
          outputRange: [pace.from.y * scale, 0],
        }),
      },
    ],
  };
  return (
    <Animated.View style={[StyleSheet.absoluteFill, moving]}>
      <Svg
        width={SCENE_BOX.width * scale}
        height={SCENE_BOX.height * scale}
        viewBox={`0 0 ${SCENE_BOX.width} ${SCENE_BOX.height}`}
        fill="none"
        stroke={colors['text-tertiary']}
        strokeOpacity={layer.faint === true ? FAINT : 1}
        strokeWidth={STROKE / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <GlyphMarkList marks={layer.marks} />
      </Svg>
    </Animated.View>
  );
}

/** The web half's quieter line for what sits behind. */
const FAINT = 0.45;

/** The line on screen at every size: a smaller box draws more units for the same width. */
const STROKE = 1.5;

const styles = StyleSheet.create({
  regular: {
    width: SCENE_BOX.width * SCENE_SCALE.regular,
    height: SCENE_BOX.height * SCENE_SCALE.regular,
  },
  compact: {
    width: SCENE_BOX.width * SCENE_SCALE.compact,
    height: SCENE_BOX.height * SCENE_SCALE.compact,
  },
});
