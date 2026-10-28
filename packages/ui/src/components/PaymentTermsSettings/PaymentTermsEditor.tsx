import { basisPointsOfShare } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button/Button';
import { Badge } from '../Chip/Chip';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview';
import { IconButton } from '../IconButton/IconButton';
import { Input } from '../Input/Input';
import { NumberField } from '../NumberField/NumberField';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame';
import type { PreviewFrameLoading } from '../PreviewFrame/PreviewFrame.types';
import { Provenance } from '../Provenance/Provenance';
import { TERMS_PREVIEW, termsDocumentProps } from './PaymentTermsSettings.logic';
import type { PaymentTermsEditorProps, PaymentTermsLineView } from './PaymentTermsSettings.types';

/** The frame's loading while the api's amounts are out, named for the busy region. */
function loadingOf(loading: boolean, label: string): PreviewFrameLoading {
  return loading ? { loading: true, loadingLabel: label } : { loading: false };
}

/**
 * The editor's body (`SCR-M01-20` m20-c, m20-g): the schedule the customer gets on top, the
 * template's name, a line per tranche, *Add a tranche*, then *Use for new proposals* and
 * *Archive*. The foot (`PaymentTermsFoot`) and the surface around them are the caller's.
 */
export function PaymentTermsEditor(props: PaymentTermsEditorProps) {
  const { words, preview } = props;
  return (
    <div className="hg-pay-editor">
      <div className="hg-pay-stage">
        <PreviewFrame
          surface="sheet"
          designWidth={TERMS_PREVIEW.width}
          minScale={TERMS_PREVIEW.minScale}
          maxHeight={props.previewHeight}
          {...loadingOf(preview.loading, words.schedule)}
        >
          <DocumentPreview {...termsDocumentProps(props.letterhead, preview, words)} />
        </PreviewFrame>
        <div className="hg-pay-stage-captions">
          <Text variant="caption" color="secondary">
            {words.previewCaption}
          </Text>
          <div className="hg-pay-figure">
            <Text variant="caption" color="secondary">
              {words.sampleContract}
            </Text>
            {preview.contract === undefined ? null : (
              <Text variant="mono" className="hg-pay-number">
                {preview.contract}
              </Text>
            )}
            <Provenance tier="assumed" size={12} inline />
          </div>
          <div className="hg-pay-figure">
            <Text variant="caption" color="secondary">
              {words.eachAmount}
            </Text>
            <Provenance tier="derived" size={12} inline />
          </div>
        </div>
      </div>
      {/* Only new terms carry a name field: no locked frame draws one on saved terms. */}
      {props.standing === 'new' ? (
        <Input
          label={words.termsName}
          value={props.name}
          onChange={props.onName}
          density="functional"
          {...(props.nameError === undefined ? {} : { error: props.nameError })}
        />
      ) : null}
      <div className="hg-pay-lines">
        {props.lines.map((line, index) => (
          <TrancheLine key={line.key} line={line} first={index === 0} {...props} />
        ))}
      </div>
      {props.canAdd ? (
        <div className="hg-pay-start">
          <Button variant="secondary" size="sm" onClick={props.onAdd}>
            {words.addTranche}
          </Button>
        </div>
      ) : (
        <Text variant="caption" color="secondary" className="hg-pay-pretty">
          {words.cap}
        </Text>
      )}
      <StandingActs {...props} />
    </div>
  );
}

function TrancheLine({
  line,
  first,
  words,
  canRemove,
  onLineName,
  onLineShare,
  onRemove,
  onPickStage,
}: PaymentTermsEditorProps & { line: PaymentTermsLineView; first: boolean }) {
  return (
    <div className="hg-pay-line">
      <div className="hg-pay-line-fields">
        <div className="hg-pay-grow">
          <Input
            label={first ? words.name : words.nameOf(line.name)}
            labelSpokenOnly={!first}
            value={line.name}
            onChange={(name) => onLineName(line.key, name)}
            density="functional"
            {...(line.nameError === undefined ? {} : { error: line.nameError })}
          />
        </div>
        <div className="hg-pay-share">
          <NumberField
            {...(first ? { label: words.share } : { ariaLabel: words.shareOf(line.name) })}
            {...(line.share === undefined ? {} : { value: line.share })}
            // As typed: on touch a tap on ✕ or *Save terms* never leaves the field first, so a
            // figure kept for the leave would be lost, or saved without the leave asking.
            commits="as-typed"
            onCommit={(share) => onLineShare(line.key, basisPointsOfShare(share))}
            density="functional"
            unit="%"
            min={0.01}
            max={100}
            precision={2}
            steppers={false}
            outOfRange="refuse"
            refusalPath={words.shareRange}
            {...(line.shareError === undefined ? {} : { error: line.shareError })}
          />
        </div>
        {canRemove ? (
          <IconButton
            label={words.remove(line.name)}
            size={40}
            variant="ghost"
            onClick={() => onRemove(line.key)}
          >
            <ShellGlyph name="trash" size="sm" />
          </IconButton>
        ) : null}
      </div>
      <div className="hg-pay-due">
        <Button
          variant="ghost"
          size="sm"
          iconRight={<ShellGlyph name="chevron" size="sm" />}
          onClick={() => onPickStage(line.key)}
        >
          {words.dueAt(line.stage)}
        </Button>
        {line.skippable ? (
          <Badge tone="warning" density="functional">
            {words.skippableMark}
          </Badge>
        ) : null}
      </div>
      {line.skippable ? (
        <Text variant="caption" color="secondary" className="hg-pay-pretty">
          {words.skippableRule}
        </Text>
      ) : null}
    </div>
  );
}

/** *Use for new proposals* and *Archive*; on the default, the fact in words; a new template, neither. */
function StandingActs({
  words,
  standing,
  acting,
  onMakeDefault,
  onArchive,
}: PaymentTermsEditorProps) {
  if (standing === 'new') return null;
  if (standing === 'default') {
    return (
      <Text variant="body-sm" color="secondary" className="hg-pay-pretty">
        {words.isDefault}
      </Text>
    );
  }
  return (
    <div className="hg-pay-acts">
      <Button
        variant="secondary"
        size="md"
        loading={acting === 'make-default'}
        onClick={onMakeDefault}
      >
        {words.makeDefault}
      </Button>
      <Button variant="ghost" size="md" loading={acting === 'archive'} onClick={onArchive}>
        {words.archive}
      </Button>
    </div>
  );
}
