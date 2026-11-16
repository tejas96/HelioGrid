import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { EditorSurface } from '../EditorSurface';
import { FailedRead } from '../EmptyState';
import { HueTile } from '../HueTile';
import { LoadingBars } from '../LoadingBars';
import { AfterHint, failedReadOf } from '../ProposalAfterParts';
import { SearchField } from '../SearchField';
import { pickLeadSheetOf } from './ProposalList.logic';
import type { PickLeadSheetProps } from './ProposalList.types';
import './ProposalList.css';

function Leads(props: PickLeadSheetProps) {
  const { leads, words, pendingId } = props;
  if (leads.kind === 'loading') {
    return <LoadingBars bars={['option', 'option', 'option']} label={words.loading} />;
  }
  if (leads.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, leads.retry, props.focusAfter)} />;
  }
  if (leads.kind === 'empty' || leads.value.length === 0) {
    return (
      <Text variant="body-sm" color="secondary">
        {words.none}
      </Text>
    );
  }
  return (
    <>
      {leads.value.map((lead) => (
        <Pressable
          key={lead.id}
          className="hg-pick-lead-row"
          disabled={pendingId !== null}
          accessibilityState={{ busy: pendingId === lead.id }}
          onPress={() => props.onPick(lead.id)}
        >
          <Avatar name={lead.name} size={40} />
          <span className="hg-pick-lead-words">
            <b>{lead.name}</b>
            <span>{lead.line}</span>
          </span>
          <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
        </Pressable>
      ))}
    </>
  );
}

/** *Copy for which customer?*, on the web. */
export function PickLeadSheet(props: PickLeadSheetProps) {
  const { open, words, failure } = props;
  const frame = pickLeadSheetOf(props);
  const { out } = frame;
  return (
    <EditorSurface {...frame.sheet} showClose desktop="modal">
      {open ? (
        <div className="hg-pick-lead" aria-busy={out ? true : undefined}>
          <SearchField {...frame.search} />
          <div className="hg-pick-lead-rows">
            <Leads {...props} />
            <Pressable className="hg-pick-lead-row" disabled={out} onPress={props.onNewCustomer}>
              <HueTile glyph="plus" hue="ocean" size={40} />
              <span className="hg-pick-lead-words">
                <b>{words.newCustomer}</b>
                <span>{words.newCustomerLine}</span>
              </span>
              <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
            </Pressable>
          </div>
          {failure === null ? null : (
            <Text variant="body-sm" color="danger" live>
              {failure}
            </Text>
          )}
          <AfterHint>{words.hint}</AfterHint>
        </div>
      ) : null}
    </EditorSurface>
  );
}
