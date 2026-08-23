import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { DropzoneProps } from './Dropzone.types';
import { CameraGlyph, DropzoneSpinner, FileGlyph } from './DropzoneGlyphs.native';
import { DropzoneHeld } from './DropzoneHeld.native';
import { DropzoneThumbs } from './DropzoneThumbs.native';
import { captureLine, sizeErrorMessage } from './dropzone-copy';
import { HELD_DEFAULTS, heldCountWords, heldTotal } from './dropzone-held';

interface NativeDropzoneProps extends DropzoneProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  /* ⚠ BORDER EXCEPTION — the dashed edge is the affordance, not a container border. It is one of
     only two legal exceptions to the no-borders rule. Do not replace it with a shadow or a tint. */
  surface: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors['text-disabled'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors['surface-alt'],
    padding: theme.spacing['sp-8'],
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  surfaceFunctional: {
    borderRadius: theme.radius['rf-xl'],
    padding: theme.spacing['sp-5'],
  },
  surfaceError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors['danger-bg'],
  },
  track: {
    marginTop: theme.spacing['sp-2'],
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  error: { marginTop: theme.spacing['sp-2'], marginHorizontal: theme.spacing['sp-0-5'] },
});

/**
 * The same capture surface, the same dashed affordance, the same thumbnails.
 *
 * TWO PLATFORM MAPPINGS. There is no drag-and-drop on a phone, so the `over` state has no
 * counterpart and the surface has one interaction: a press. And React Native has no file input —
 * a picker needs a native module `@heliogrid/ui` must not depend on — so the press calls
 * `onRequestFiles` and the app hands the result back through `onFiles`.
 */
export function Dropzone({
  label = 'Add roof photos',
  hint,
  accept = 'image/*',
  capture,
  files = [],
  onRemove,
  maxSizeMB = 10,
  state = 'idle',
  errorMessage,
  progress = null,
  heldOnDevice = false,
  heldCount,
  onRetry,
  retryLabel = HELD_DEFAULTS.retryLabel,
  heldMessage,
  heldNoun,
  heldNounPlural,
  failedMessage = HELD_DEFAULTS.failedMessage,
  timeoutMessage = HELD_DEFAULTS.timeoutMessage,
  retryTimeout = HELD_DEFAULTS.retryTimeout,
  onRequestFiles,
  density = 'expressive',
  disabled = false,
  style,
}: NativeDropzoneProps) {
  const isError = state === 'error';
  const busy = state === 'uploading';
  const isImage = accept.startsWith('image');
  const countWords = heldCountWords(heldTotal(heldCount, files.length), {
    accept,
    heldNoun,
    heldNounPlural,
  });

  const line = captureLine({
    busy,
    hint,
    accept,
    capture,
    maxSizeMB,
    /* There is no drop target on a phone, so the phrase drops the drag half of the web's. */
    browsePhrase: 'Tap to browse',
  });

  return (
    <View style={style}>
      <Pressable
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onRequestFiles}
        style={[
          styles.surface,
          density === 'functional' ? styles.surfaceFunctional : undefined,
          isError ? styles.surfaceError : undefined,
        ]}
      >
        {busy ? <DropzoneSpinner /> : isImage ? <CameraGlyph /> : <FileGlyph />}
        {/* THE NAME OF THE ACT SURVIVES THE WAIT — the spinner is the progress channel and the
            state goes in the line below, never in place of the label. */}
        <Text variant="h4" align="center" color={disabled ? 'disabled' : 'primary'}>
          {label}
        </Text>
        <Text variant="body-sm" align="center" color="secondary">
          {line}
        </Text>
      </Pressable>

      {busy && progress !== null ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
        </View>
      ) : null}

      {isError ? (
        /* The web half's `role="alert"`, which is the WORD for "this interrupts"; the live region is
           only how Android delivers it. Both, the way every other message in this package does it. */
        <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
          <Text variant="body-sm" color="danger">
            {errorMessage ?? sizeErrorMessage(maxSizeMB)}
          </Text>
        </View>
      ) : null}

      {heldOnDevice ? (
        <DropzoneHeld
          busy={busy}
          countWords={countWords}
          failedMessage={failedMessage}
          heldMessage={heldMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          retryTimeout={retryTimeout}
          timeoutMessage={timeoutMessage}
        />
      ) : null}

      {files.length > 0 ? <DropzoneThumbs files={files} onRemove={onRemove} /> : null}
    </View>
  );
}
