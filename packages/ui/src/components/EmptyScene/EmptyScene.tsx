import type { CSSProperties } from 'react';
import { GlyphMarkList } from '../AppShell/ShellGlyphMarks';
import { PACES, SCENE_BOX, SCENES, type SceneLayer } from './EmptyScene.shapes';
import type { EmptySceneProps } from './EmptyScene.types';

/**
 * The scene, drawn in the quiet text colour so it follows light, dark and field mode. Each layer
 * moves in once and rests (`EmptyScene.css`); under reduced motion the duration tokens fall to 1ms,
 * so it shows at rest at once.
 */
export function EmptyScene({ name, size = 'regular' }: EmptySceneProps) {
  return (
    <svg
      className="hg-empty-scene"
      data-size={size}
      viewBox={`0 0 ${SCENE_BOX.width} ${SCENE_BOX.height}`}
      aria-hidden="true"
      focusable="false"
    >
      {SCENES[name].map((layer) => (
        <g
          key={`${layer.pace}-${layer.step}`}
          className="hg-empty-scene-layer"
          data-faint={layer.faint === true ? 'true' : undefined}
          style={paceOf(layer)}
        >
          <GlyphMarkList marks={layer.marks} />
        </g>
      ))}
    </svg>
  );
}

/** The layer's start, length, curve and turn, handed to the one entry keyframe. */
function paceOf(layer: SceneLayer): CSSProperties {
  const pace = PACES[layer.pace];
  return {
    '--hg-scene-from-x': `${pace.from.x}px`,
    '--hg-scene-from-y': `${pace.from.y}px`,
    '--hg-scene-duration': `var(--dur-${pace.duration})`,
    '--hg-scene-easing': `var(--ease-${pace.easing})`,
    '--hg-scene-step': `${layer.step}`,
  } as CSSProperties;
}
