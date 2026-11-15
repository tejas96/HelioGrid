import type { VersionInForcePreview } from '@heliogrid/contracts';
import { Text } from '../../primitives/Text';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { AfterHint, AfterRow, AfterRows, AfterSummary } from '../ProposalAfterParts';
import { StatusChip } from '../StatusChip';
import { inForcePartOf, inForceSheetOf } from './ProposalVersions.logic';
import type { PutInForceSheetProps } from './ProposalVersions.types';
import './ProposalVersions.css';

function Body(props: PutInForceSheetProps & { readonly facts: VersionInForcePreview }) {
  const { words, facts, sending, failure } = props;
  return (
    <div className="hg-in-force" aria-busy={sending ? true : undefined}>
      <AfterSummary rows={words.summary(facts)} />
      <Text as="h3" variant="overline" color="secondary">
        {words.planTitle}
      </Text>
      <AfterRows>
        {facts.plan.map((part, index) => {
          const row = inForcePartOf(words, part, facts.plan);
          return (
            <AfterRow
              // biome-ignore lint/suspicious/noArrayIndexKey: a plan's parts keep their order and may repeat a name
              key={index}
              {...row.row}
              aside={
                <span className="hg-in-force-aside">
                  {row.chip === null ? null : <StatusChip {...row.chip} density="functional" />}
                  <span className="hg-in-force-amount">{row.amount}</span>
                </span>
              }
            />
          );
        })}
      </AfterRows>
      <AfterHint>{words.hint}</AfterHint>
      {failure === null ? null : (
        <Text variant="body-sm" color="danger" live>
          {failure}
        </Text>
      )}
      <Button variant="primary" size="lg" fullWidth loading={sending} onClick={props.onConfirm}>
        {words.confirm}
      </Button>
      <Text variant="caption" color="secondary" align="center">
        {words.recorded}
      </Text>
    </div>
  );
}

/** *Put version N in force*, on the web: what changes, shown before the person confirms. */
export function PutInForceSheet(props: PutInForceSheetProps) {
  const { open, preview } = props;
  return (
    <EditorSurface {...inForceSheetOf(props)} showClose desktop="modal">
      {open && preview.kind === 'ready' ? <Body {...props} facts={preview.value} /> : null}
    </EditorSurface>
  );
}
