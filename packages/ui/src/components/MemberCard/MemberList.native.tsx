import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { BannerAction } from '../Banner/BannerAction.native';
import { Button } from '../Button/Button.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { memberCardOf, memberListEmptyOf } from './MemberCard.logic';
import { MemberCard } from './MemberCard.native';
import type { MemberListProps } from './MemberCard.types';
import { MemberCardsLoading } from './MemberCardsLoading.native';

const styles = StyleSheet.create({
  list: { gap: theme.layout['tile-gap'] },
});

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
    if (waiting === undefined) return <MemberCardsLoading label={words.loading} />;
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
    <View style={styles.list} accessibilityLabel={words.label} role="region" collapsable={false}>
      {view.rows.map((row) => (
        <MemberCard
          key={row.id}
          {...memberCardOf(row, words.row(row), words.role, words.you)}
          action={actOf?.(row)}
          onOpen={openOf?.(row)}
        />
      ))}
    </View>
  );
  if (surface !== 'teaching') return list;
  return (
    <>
      {list}
      <EmptyState
        icon={<ShellGlyph name="people" size="xl" tone="primary" />}
        title={words.alone}
        description={words.aloneLine}
        action={teachingAction}
      />
    </>
  );
}
