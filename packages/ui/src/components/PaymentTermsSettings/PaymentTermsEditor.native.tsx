import { basisPointsOfShare } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { Badge } from '../Chip/Chip.native';
import { DocumentPreview } from '../DocumentPreview/DocumentPreview.native';
import { IconButton } from '../IconButton/IconButton.native';
import { Input } from '../Input/Input.native';
import { NumberField } from '../NumberField/NumberField.native';
import { PreviewFrame } from '../PreviewFrame/PreviewFrame.native';
import type { PreviewFrameLoading } from '../PreviewFrame/PreviewFrame.types';
import { Provenance } from '../Provenance/Provenance.native';
import { TERMS_PREVIEW, termsDocumentProps } from './PaymentTermsSettings.logic';
import type { PaymentTermsEditorProps, PaymentTermsLineView } from './PaymentTermsSettings.types';

/** The frame's loading while the api's amounts are out, named for the busy region. */
function loadingOf(loading: boolean, label: string): PreviewFrameLoading {
  return loading ? { loading: true, loadingLabel: label } : { loading: false };
}

/**
 * The editor's body on the phone (`SCR-M01-20` m20-c): the schedule the customer gets on top, the
 * template's name, a line per tranche, *Add a tranche*, then the two acts. The sheet around it and
 * its foot (`PaymentTermsFoot`) are the screen's.
 */
export function PaymentTermsEditor(props: PaymentTermsEditorProps) {
  const { words, preview } = props;
  return (
    <View style={styles.editor}>
      <View style={styles.stage}>
        <PreviewFrame
          surface="sheet"
          designWidth={TERMS_PREVIEW.width}
          minScale={TERMS_PREVIEW.minScale}
          maxHeight={props.previewHeight}
          {...loadingOf(preview.loading, words.schedule)}
        >
          <DocumentPreview {...termsDocumentProps(props.letterhead, preview, words)} />
        </PreviewFrame>
        <View style={styles.captions}>
          <Text variant="caption" color="secondary">
            {words.previewCaption}
          </Text>
          <View style={styles.figure}>
            <Text variant="caption" color="secondary">
              {words.sampleContract}
            </Text>
            {preview.contract === undefined ? null : (
              <Text variant="mono" oneLine>
                {preview.contract}
              </Text>
            )}
            <Provenance tier="assumed" size={12} inline />
          </View>
          <View style={styles.figure}>
            <Text variant="caption" color="secondary">
              {words.eachAmount}
            </Text>
            <Provenance tier="derived" size={12} inline />
          </View>
        </View>
      </View>
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
      <View style={styles.lines}>
        {props.lines.map((line, index) => (
          <TrancheLine key={line.key} line={line} first={index === 0} {...props} />
        ))}
      </View>
      {props.canAdd ? (
        <View style={styles.start}>
          <Button variant="secondary" size="sm" onClick={props.onAdd}>
            {words.addTranche}
          </Button>
        </View>
      ) : (
        <Text variant="caption" color="secondary">
          {words.cap}
        </Text>
      )}
      <StandingActs {...props} />
    </View>
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
    <View style={styles.line}>
      <View style={styles.fields}>
        <View style={styles.grow}>
          <Input
            label={first ? words.name : words.nameOf(line.name)}
            labelSpokenOnly={!first}
            value={line.name}
            onChange={(name) => onLineName(line.key, name)}
            density="functional"
            {...(line.nameError === undefined ? {} : { error: line.nameError })}
          />
        </View>
        <View style={styles.share}>
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
        </View>
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
      </View>
      <View style={styles.due}>
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
      </View>
      {line.skippable ? (
        <Text variant="caption" color="secondary">
          {words.skippableRule}
        </Text>
      ) : null}
    </View>
  );
}

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
      <Text variant="body-sm" color="secondary">
        {words.isDefault}
      </Text>
    );
  }
  return (
    <View style={styles.acts}>
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
    </View>
  );
}

/* The board's 92 share field, never squeezed by a long name beside it. */
const SHARE_WIDTH = 92;

const styles = StyleSheet.create({
  editor: { gap: theme.spacing['sp-4'] },
  stage: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    backgroundColor: theme.colors['canvas-sunken'],
    borderRadius: theme.radius['r-lg'],
  },
  captions: { gap: theme.spacing['sp-0-5'], paddingHorizontal: theme.spacing['sp-1'] },
  figure: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-1'],
  },
  lines: { gap: theme.spacing['sp-3'] },
  line: {
    gap: theme.spacing['sp-1'],
    paddingBottom: theme.spacing['sp-3'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors['line-soft'],
  },
  fields: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing['sp-2'] },
  grow: { flex: 1, minWidth: 0 },
  share: { width: SHARE_WIDTH, flexShrink: 0 },
  /** A ghost button's words sit 16 into its pill: the pill steps out so its words line up. */
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing['sp-2'],
    marginLeft: -theme.spacing['sp-4'],
  },
  start: { flexDirection: 'row' },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
});
