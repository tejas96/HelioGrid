/* QRCode (native) — same encoder, same failure law: if the payload can't be encoded it SAYS so and
   still shows the link (MS9-14), never an empty square that reads as a QR which merely won't scan.

   One difference from the web half, and it is a rendering detail only: the web draws one <rect> per
   dark module, which at version 10 is ~1,600 nodes. react-native-svg pays a real per-node cost on
   the mid-range Android phones these screens are read on, so the native half emits the same modules
   as one <Path> of 1×1 squares. Identical geometry, identical output, one node. */

import { theme } from '@heliogrid/theme';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import { encodeQR } from '../../utils/qr-encode';
import type { QRCodeProps } from './QRCode.types';

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  code: { backgroundColor: theme.colors.surface, borderRadius: theme.radius['r-sm'] },
  failed: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-4'],
    backgroundColor: theme.colors['warning-bg'],
    borderRadius: theme.radius['r-md'],
  },
  failedTitle: { fontWeight: '700' },
  centred: { textAlign: 'center' },
  link: { fontFamily: theme.type.families.mono, textAlign: 'center' },
});

interface NativeQRCodeProps extends QRCodeProps {
  style?: StyleProp<ViewStyle>;
}

/** The dark modules as one path: `M x y h1 v1 h-1 z` per module. */
function modulePath(matrix: boolean[][], quietZone: number): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row) {
      continue;
    }
    for (let c = 0; c < row.length; c++) {
      if (row[c]) {
        parts.push(`M${c + quietZone} ${r + quietZone}h1v1h-1z`);
      }
    }
  }
  return parts.join('');
}

/** The link text — the fallback path, and what a customer reads out over a phone call. */
function LinkText({ value, width }: { value: string; width: number }) {
  return (
    <View style={{ maxWidth: width }}>
      <Text variant="caption" color="secondary" style={styles.link}>
        {value}
      </Text>
    </View>
  );
}

export function QRCode({
  value,
  size = 160,
  label,
  caption,
  quietZone = 4,
  showValue = true,
  errorTitle = 'QR code unavailable',
  errorMessage,
  style,
}: NativeQRCodeProps) {
  const result = useMemo(() => {
    try {
      return encodeQR(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!value || !result) {
    return (
      /* THE PANEL IS NOT ONE ELEMENT. The web half names this wrapper `role="group"`, which groups
         WITHOUT hiding anything inside it. React Native has no `group` role, and `accessible` is not
         a substitute: it folds the subtree into a single element, so the sentence below ("This link
         is too long to encode…") and the link that is the whole point of failing visibly (MS9-14)
         would be swallowed into one concatenated label. The wrapper therefore carries no name — the
         title, the sentence and the link are each read in order, exactly as on the web. */
      <View style={[styles.root, style]}>
        {/* `size` is caller data, not a design value — the only reason a dimension is inline. */}
        <View style={[styles.failed, { width: size, height: size }]}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 9v4M12 17h.01"
              stroke={theme.colors['warning-text']}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Path
              d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              stroke={theme.colors['warning-text']}
              strokeWidth={1.5}
            />
          </Svg>
          <Text variant="body-sm" style={styles.failedTitle}>
            {errorTitle}
          </Text>
        </View>
        <View style={{ maxWidth: size + 80 }}>
          <Text variant="caption" color="secondary" style={styles.centred}>
            {errorMessage ||
              (value
                ? 'This link is too long to encode. Use the link below instead.'
                : 'No link to encode yet.')}
          </Text>
        </View>
        {value && showValue ? <LinkText value={value} width={size + 80} /> : null}
      </View>
    );
  }

  const { matrix, size: n } = result;
  const total = n + quietZone * 2;

  return (
    <View style={[styles.root, style]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${total} ${total}`}
        accessible
        accessibilityRole="image"
        accessibilityLabel={label || `QR code for ${value}`}
        style={styles.code}
      >
        <Rect width={total} height={total} fill={theme.colors.surface} />
        <Path d={modulePath(matrix, quietZone)} fill={theme.colors['text-primary']} />
      </Svg>
      {caption ? (
        <Text variant="caption" color="tertiary" style={styles.centred}>
          {caption}
        </Text>
      ) : null}
      {showValue ? <LinkText value={value} width={size + 80} /> : null}
    </View>
  );
}
