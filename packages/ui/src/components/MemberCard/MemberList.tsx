import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner/Banner';
import { BannerAction } from '../Banner/BannerAction';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import { MemberCard } from './MemberCard';
import { memberCardOf, memberListEmptyOf } from './MemberCard.logic';
import type { MemberListProps } from './MemberCard.types';
import { MemberCardsLoading } from './MemberCardsLoading';

/** A team list's body (`SCR-M01-12`): one of its states (`TeamSurface`), never two at once. */
export function MemberList({
  surface,
  rows,
  words,
  onRetry,
  onClearSearch,
  onShowAll,
  records,
  waiting,
  actOf,
  openOf,
  teachingAction,
}: MemberListProps) {
  if (surface === 'loading') {
    if (waiting === undefined) return <MemberCardsLoading label={words.loading} />;
    return (
      <div role="status" aria-busy="true" aria-label={words.loading}>
        {waiting}
      </div>
    );
  }
  if (surface === 'failed') {
    return (
      <Banner
        kind="state"
        density="functional"
        title={words.loadFailed}
        action={<BannerAction onClick={onRetry}>{words.tryAgain}</BannerAction>}
      />
    );
  }
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
    <section className="hg-member-list" aria-label={words.label}>
      {rows.map((row) => (
        <MemberCard
          key={row.id}
          {...memberCardOf(row, words.row(row), words.role, words.you)}
          action={actOf?.(row)}
          onOpen={openOf?.(row)}
        />
      ))}
    </section>
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
