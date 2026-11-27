'use client';
import type { StudioPicture } from '@heliogrid/data/react';
import type { ThemePalette } from '@heliogrid/theme';
import { Grid } from '@react-three/drei';
import { groundSide } from './camera-limits';
import type { RoofTopPicture } from './photo-reader';
import { StudioOwnGround } from './StudioOwnGround';
import { type GroundPicture, StudioPictureGround } from './StudioPictureGround';

/** How high the grid lies over the ground, so the two never fight. */
const GRID_LIFT_M = 0.02;

/**
 * The scene's ground (`T-M05-002a`): the sky picture, stretched about the pin by the first true
 * length, or plain ground; your own picture laid on it; and the grid where no picture is the
 * ground. LiDAR's scan takes its place (`T-M05-002g`): it hides, still loaded, so the roofs keep
 * the picture their tops wear.
 */
export function StudioGround({
  picture,
  pictureScale,
  palette,
  hidden,
  onSharp,
  onOwnTop,
}: {
  picture: StudioPicture;
  pictureScale: number;
  palette: ThemePalette;
  hidden: boolean;
  onSharp: (picture: GroundPicture | null) => void;
  onOwnTop: (top: RoofTopPicture | null) => void;
}) {
  return (
    <group visible={!hidden}>
      {picture.kind === 'sky' ? (
        // The first true length stretches the picture about the pin with every roof on it.
        <group scale={[pictureScale, 1, pictureScale]}>
          <StudioPictureGround
            pieces={picture.laid.pieces}
            around={picture.laid.around}
            strip={picture.laid.creditStrip}
            page={palette.canvas}
            onSharp={onSharp}
          />
        </group>
      ) : (
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[groundSide(), groundSide()]} />
          <meshBasicMaterial color={palette['canvas-sunken']} toneMapped={false} />
        </mesh>
      )}
      {picture.kind === 'own' ? (
        <StudioOwnGround picture={picture} plaster={palette['scene-wall']} onTop={onOwnTop} />
      ) : null}
      {/* No picture: the grid is the ground. Your own picture lies on it, and it shows round it. */}
      {picture.kind === 'none' || picture.kind === 'own' ? (
        <Grid
          position={[0, GRID_LIFT_M, 0]}
          cellSize={1}
          sectionSize={5}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor={palette['line-soft']}
          sectionColor={palette['line-strong']}
          fadeDistance={160}
          fadeStrength={1.5}
          infiniteGrid
        />
      ) : null}
    </group>
  );
}
