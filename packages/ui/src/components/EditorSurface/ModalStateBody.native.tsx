import { theme } from '@heliogrid/theme';
import { type ReactNode, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { OverlayBody } from '../Sheet/OverlayBody.native';
import { SheetSkeleton } from '../Sheet/SheetSkeleton.native';
import type { EditorSurfaceProps } from './EditorSurface.types';
import { modalStateOf } from './modal-state';

/**
 * A decision's centred form draws its read's five states as the sheet and the panel do — loading,
 * empty, failed with *Try again*, unavailable — so a modal never opens on a blank body. An editor
 * with no read draws its body as it stands.
 */
export function ModalStateBody({
  props,
  children,
}: {
  props: EditorSurfaceProps;
  children: ReactNode;
}) {
  const frame = useRef<View>(null);
  if (props.read === undefined) return children;
  return (
    <View ref={frame}>
      <OverlayBody
        {...modalStateOf(props)}
        focusAfter={frame}
        skeleton={<SheetSkeleton density={props.density} label={props.loadingLabel} />}
        unavailableStyle={styles.unavailable}
      >
        {children}
      </OverlayBody>
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: { paddingTop: theme.spacing['sp-3'], paddingBottom: theme.spacing['sp-5'] },
});
