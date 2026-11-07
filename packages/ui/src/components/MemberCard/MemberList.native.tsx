import { View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { Button } from '../Button/Button.native';
import { CardRows } from '../CardRows/CardRows.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { memberFactsOf, memberListEmptyOf } from './MemberCard.logic';
import type { MemberListProps } from './MemberCard.types';
import { MemberRow } from './MemberRow.native';
import { MemberRowsLoading } from './MemberRowsLoading.native';

/** A team list's body (`SCR-M01-12`): its read's state or one of its bodies (`TeamSurface`), never two at once. */
export function MemberList({
  read,
  words,
  focusAfter,
  onClearSearch,
  onShowAll,
  records,
  waiting,
  actOf,
  openOf,
  teachingAction,
}: MemberListProps) {
  /* The reader is on every team, so its read is never empty: only the wait draws here. */
  if (read.kind === 'loading' || read.kind === 'empty') {
    if (waiting === undefined) return <MemberRowsLoading label={words.loading} />;
    return (
      <View
        accessible
        accessibilityLabel={words.loading}
        accessibilityLiveRegion="polite"
        accessibilityState={{ busy: true }}
      >
        {waiting}
      </View>
    );
  }
  if (read.kind === 'failed') {
    return (
      <Banner
        kind="state"
        density="functional"
        title={words.loadFailed}
        action={
          <BannerAction onClick={read.retry} focusAfter={focusAfter}>
            {words.tryAgain}
          </BannerAction>
        }
      />
    );
  }
  const { surface, view } = read.value;
  const empty = memberListEmptyOf({ surface, words, onClearSearch, onShowAll });
  if (empty !== null) {
    return (
      <EmptyState
        icon={<ShellGlyph name={empty.glyph} size="xl" tone="primary" />}
        title={empty.title}
        action={
          <Button variant="secondary" size="lg" onClick={empty.onAct}>
            {empty.act}
          </Button>
        }
      />
    );
  }
  const list = records ?? (
    <View accessibilityLabel={words.label} role="region" collapsable={false}>
      <CardRows>
        {view.rows.map((row, index) => (
          <MemberRow
            key={row.id}
            {...memberFactsOf(row, words.row(row), words.role, words.you)}
            action={actOf?.(row)}
            onOpen={openOf?.(row)}
            first={index === 0}
          />
        ))}
      </CardRows>
    </View>
  );
  if (surface !== 'teaching') return list;
  return (
    <>
      {list}
      <EmptyState
        moment="empty-team"
        title={words.alone}
        description={words.aloneLine}
        action={teachingAction}
      />
    </>
  );
}
