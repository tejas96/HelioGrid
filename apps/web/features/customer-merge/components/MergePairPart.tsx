'use client';
import type { CustomerMergeScreen } from '@heliogrid/data/react';
import type { MergeView } from '@heliogrid/domain';
import { customerMergeFactsOf, customerMergePairWords, customerMergeWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  HeroPanel,
  MergeAct,
  MergeCompare,
  MergeMoves,
  mergeCompareOf,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';

/**
 * The pair on the web: the compare, and beside it the one hero that reads like the confirm — what
 * moves into the record that stays, what the other becomes, no money, that it cannot be undone —
 * with the act under it, asleep until every differing field is picked (`M02-63`).
 */
export function MergePairPart({ screen, view }: { screen: CustomerMergeScreen; view: MergeView }) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerMergeWords(t);
  const pair = customerMergePairWords(t, customerMergeFactsOf(view, screen.failure, format.phone));
  const compare = mergeCompareOf(view, words, format.phone);
  return (
    <div className="hg-customer-merge-pair">
      <div className="hg-customer-merge-compare">
        {screen.canChangeOther ? (
          <div>
            <Button
              variant="ghost"
              size="sm"
              icon={<ShellGlyph name="search" size="sm" />}
              disabled={screen.merging}
              onClick={screen.changeOther}
            >
              {words.find.otherRecord}
            </Button>
          </div>
        ) : null}
        <MergeCompare
          {...compare}
          same={pair.same}
          onStay={screen.stay}
          onPick={screen.pick}
          disabled={screen.merging}
          words={pair.compare}
        />
      </div>
      <aside className="hg-customer-merge-aside">
        <HeroPanel label={pair.moves.heading}>
          <MergeMoves
            heading={pair.moves.into}
            rows={pair.moves.rows}
            tombstone={pair.moves.tombstone}
            noMoney={pair.moves.noMoney}
            cannotUndo={pair.moves.cannotUndo}
            none={pair.moves.none}
          />
          {view.needsUpdate ? <p className="hg-customer-merge-line">{words.needsUpdate}</p> : null}
          <MergeAct
            label={words.merge}
            onMerge={screen.merge}
            awake={screen.canMerge}
            merging={screen.merging}
            waiting={words.merging}
            failure={pair.failure}
            line={pair.leftLine}
            warning={null}
          />
        </HeroPanel>
      </aside>
    </div>
  );
}
