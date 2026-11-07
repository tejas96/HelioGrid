import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner/Banner';
import { BannerAction } from '../Banner/BannerAction';
import { Button } from '../Button/Button';
import { CardRows } from '../CardRows';
import { EmptyState } from '../EmptyState/EmptyState';
import { memberFactsOf, memberListEmptyOf } from './MemberCard.logic';
import type { MemberListProps } from './MemberCard.types';
import { MemberRow } from './MemberRow';
import { MemberRowsLoading } from './MemberRowsLoading';

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
      <div role="status" aria-busy="true" aria-label={words.loading}>
        {waiting}
      </div>
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
    <section aria-label={words.label}>
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
    </section>
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
