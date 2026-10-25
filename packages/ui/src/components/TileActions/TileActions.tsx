import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import type { TileActionProps, TileActionsProps } from './TileActions.types';

interface WebTileActionProps extends TileActionProps {
  className?: string;
  /** Lands on the target, as the design system's does. */
  style?: CSSProperties;
}

interface WebTileActionsProps extends TileActionsProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A labelled 36px pill inside a 44px target. The target is the outer rectangle and the pill the
 * inner one; `Pressable` owns the floor and the focus ring, and a toggle's pressed state rides
 * its `accessibilityState` (`aria-pressed`).
 */
export function TileAction({
  icon,
  label,
  onLabel,
  spokenLabel,
  on,
  onClick,
  disabled = false,
  className,
  style,
}: WebTileActionProps) {
  const hasIcon = icon !== undefined && icon !== null;
  return (
    <Pressable
      className={classNames('hg-tile-action', className)}
      style={style}
      onPress={onClick}
      disabled={disabled}
      accessibilityLabel={spokenLabel}
      accessibilityState={on === undefined ? undefined : { selected: on }}
    >
      <span
        className="hg-tile-action-pill"
        data-on={on ? 'true' : undefined}
        data-icon={hasIcon ? 'true' : undefined}
      >
        {hasIcon ? (
          <span className="hg-tile-action-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {on && onLabel ? onLabel : label}
      </span>
    </Pressable>
  );
}

/** The foot of a list tile: its action pills, below a thin line. `RecordCard` draws it from `actions`. */
export function TileActions({ children, rule = true, className, style }: WebTileActionsProps) {
  return (
    <div
      className={classNames('hg-tile-actions', className)}
      data-rule={rule ? 'true' : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
