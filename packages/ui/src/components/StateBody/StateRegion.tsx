import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { EmptyScene } from '../EmptyScene/EmptyScene';
import type { StateRegionProps } from './StateBody.types';

type WebStateRegionProps = StateRegionProps & { className?: string; style?: CSSProperties };

/** The centred form of a blocked surface that has room (`StateBody.types.ts`). */
export function StateRegion({
  tone,
  glyph,
  scene,
  title,
  message,
  action,
  className,
  style,
}: WebStateRegionProps) {
  return (
    <div className={classNames('hg-state-region', className)} style={style}>
      {scene === undefined ? (
        <span className="hg-state-region-mark hg-tone" data-tone={tone ?? 'neutral'}>
          <ShellGlyph name={tone === 'warning' ? 'alert-circle' : glyph} size="lg" tone="current" />
        </span>
      ) : (
        <EmptyScene name={scene} />
      )}
      {title === undefined || title === null ? null : (
        <Text variant="h4" as="div" align="center">
          {title}
        </Text>
      )}
      {message === undefined || message === null ? null : (
        <Text
          variant="body-sm"
          color="secondary"
          align="center"
          className="hg-state-region-message"
        >
          {message}
        </Text>
      )}
      {action}
    </div>
  );
}
