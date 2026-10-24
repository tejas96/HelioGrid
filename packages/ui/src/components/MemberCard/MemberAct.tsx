import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { MEMBER_ACT_LOOK } from './MemberCard.logic';
import type { MemberActProps } from './MemberCard.types';

/** A row's one act (`SCR-M01-12`): the card's foot at `md`, the table's last cell at `sm`. */
export function MemberAct({
  act,
  label,
  size,
  fullWidth = false,
  offReason,
  busy = false,
  spokenName,
  onPress,
  ref,
}: MemberActProps) {
  const look = MEMBER_ACT_LOOK[act];
  return (
    <Button
      ref={ref}
      variant={look.variant}
      size={size}
      fullWidth={fullWidth}
      {...(look.danger ? { tone: 'danger' as const } : {})}
      icon={
        <ShellGlyph
          name={look.glyph}
          size="sm"
          tone={offReason === undefined ? look.glyphTone : 'secondary'}
        />
      }
      disabled={offReason !== undefined}
      disabledReason={offReason}
      loading={busy}
      spokenName={spokenName}
      onClick={onPress}
    >
      {label}
    </Button>
  );
}
