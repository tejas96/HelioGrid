import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { Surface } from '../../primitives/Surface/Surface.native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { BrandColorField } from '../BrandColorField/BrandColorField.native';
import { Button } from '../Button/Button.native';
import { Dropzone } from '../Dropzone/Dropzone.native';
import { ImageFrame } from '../Image/Image.native';
import { Input } from '../Input/Input.native';
import { Textarea } from '../Textarea/Textarea.native';
import { BRANDING_LOGO_MARK, brandingColourShown } from './BrandingSettings.logic';
import type { BrandingSettingsProps } from './BrandingSettings.types';

/** The fewest rows the lines field shows, so an empty one still reads as a list (s18-k3). */
const LINES_ROWS_MIN = 2;

/** What the logo files the device may pick are (`dropEmpty`); the app's check holds the limits. */
const LOGO_ACCEPT = 'image/png,image/jpeg';

type PartProps = Pick<
  BrandingSettingsProps,
  | 'words'
  | 'part'
  | 'document'
  | 'logoRefusal'
  | 'onChooseLogo'
  | 'onPickLogo'
  | 'onRemoveLogo'
  | 'colour'
  | 'onColour'
  | 'letterheadFields'
>;

/** The one part the editor's switch has open. */
export function BrandingPart(props: PartProps) {
  if (props.part === 'colour') return <ColourPart {...props} />;
  if (props.part === 'letterhead') return <LetterheadPart {...props} />;
  return <LogoPart {...props} />;
}

/**
 * The logo: the held or saved mark in one row on the white it prints on, with its name, the
 * limits, *Replace* and *Remove*; with none, the capture surface a tap opens the system's picker from. A file
 * refused is said first, and the mark it would have replaced stays (s18-p).
 */
function LogoPart(props: PartProps) {
  const { words, document, logoRefusal, onChooseLogo, onPickLogo } = props;
  /* A removed logo gives way to the capture surface, where the person adds the next one. */
  const logo = useRef<View>(null);
  return (
    <View ref={logo} style={styles.logo}>
      {logoRefusal === undefined ? null : (
        <Banner kind="validation" tone="warning" title={logoRefusal} density="functional" />
      )}
      {document.logoSrc === undefined ? (
        <Dropzone
          words={words.dropzone}
          label={words.addLogo}
          hint={words.limits}
          accept={LOGO_ACCEPT}
          multiple={false}
          density="functional"
          onRequestFiles={onPickLogo}
          onFiles={(picked) => {
            const first = picked[0];
            if (first !== undefined) onChooseLogo(first);
          }}
        />
      ) : (
        <HeldLogo {...props} logoSrc={document.logoSrc} focusAfter={logo} />
      )}
    </View>
  );
}

/**
 * A held mark and its two acts, in one row on the white it prints on: the mark in its tile, the
 * part's name over the limits, then *Replace* and *Remove* — on their own line when the row runs short.
 */
function HeldLogo({
  words,
  logoSrc,
  onPickLogo,
  onRemoveLogo,
  focusAfter,
}: PartProps & { logoSrc: string; focusAfter: FocusAfter }) {
  const leaving = useFocusAfter(focusAfter);
  return (
    <>
      {/* The paper the mark prints on: a page ground, whatever holds it. */}
      <Surface background="surface" radius="md" style={styles.paper}>
        <View style={styles.mark}>
          <ImageFrame
            src={logoSrc}
            alt={words.logoAlt}
            missingLabel={words.logoUnavailable}
            missingDetail=""
            words={words.image}
            width={BRANDING_LOGO_MARK.width}
            height={BRANDING_LOGO_MARK.height}
            fit="contain"
            density="functional"
          />
        </View>
        <View style={styles.logoWords}>
          <Text variant="body-sm" bold>
            {words.logo}
          </Text>
          <Text variant="caption" color="secondary">
            {words.limits}
          </Text>
        </View>
        <View style={styles.logoActs}>
          <Button variant="secondary" size="sm" onClick={onPickLogo}>
            {words.replace}
          </Button>
          <Button variant="ghost" size="sm" tone="danger" onClick={leaving(onRemoveLogo)}>
            {words.remove}
          </Button>
        </View>
      </Surface>
    </>
  );
}

/** The colour, judged in one line: the live cover above is the specimen, so the field drops its own. */
function ColourPart({ words, document, colour, onColour }: PartProps) {
  return (
    <BrandColorField
      words={words.colourField}
      value={brandingColourShown(colour)}
      onChange={onColour}
      companyName={document.companyName}
      helper=""
      specimen={false}
      verdict="short"
      density="functional"
    />
  );
}

/** The letterhead's three fields, each with its own refusal; the lines field grows with its lines. */
function LetterheadPart({ words, letterheadFields: fields }: PartProps) {
  return (
    <View style={styles.letterhead}>
      <Input
        label={words.tagline}
        value={fields.tagline}
        onChange={fields.onTagline}
        error={fields.taglineError}
        density="functional"
      />
      <Textarea
        label={words.lines}
        value={fields.lines}
        onChange={fields.onLines}
        placeholder={words.linesPlaceholder}
        helper={words.linesHint}
        rows={Math.max(LINES_ROWS_MIN, fields.lines.split('\n').length)}
        error={fields.linesError}
        density="functional"
      />
      <Input
        label={words.footerNote}
        value={fields.footerNote}
        onChange={fields.onFooterNote}
        error={fields.footerNoteError}
        density="functional"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /** A refusal, the mark and its foot, `sp-3` apart (`SCR-M01-18`, *Logo* at 375). */
  logo: { gap: theme.spacing['sp-3'] },
  /** One row on the white, `sp-3` apart inside its soft edge; the acts wrap to their own line. */
  paper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  /** The mark's tile: the logo contained in a quiet well, so a wide or a round mark both read. */
  mark: {
    flexShrink: 0,
    padding: theme.spacing['sp-2'],
    backgroundColor: colors['canvas-sunken'],
    borderRadius: theme.radius['r-md'],
  },
  /** The part's name over the limits; it keeps room for a word before the acts wrap. */
  logoWords: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: theme.spacing['sp-24'],
    gap: theme.spacing['sp-0-5'],
  },
  /** *Replace* and *Remove*, `sp-2` apart; they wrap when a language runs long. */
  logoActs: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  /** The three letterhead fields, `sp-4` apart. */
  letterhead: { gap: theme.spacing['sp-4'] },
});
