import { BRANDING_PARTS, COMPANY_LOGO_LIMITS } from '@heliogrid/domain';
import { useRef } from 'react';
import { type FocusAfter, useFocusAfter } from '../../primitives/FocusAfter';
import { focusAfterWithin } from '../../primitives/FocusAfter/focus-after-within';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { BrandColorField } from '../BrandColorField/BrandColorField';
import { Button } from '../Button/Button';
import { Dropzone, pickedFileOf } from '../Dropzone';
import { ImageFrame } from '../Image';
import { Input } from '../Input/Input';
import { ListRow } from '../ListRow/ListRow';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Textarea } from '../Textarea/Textarea';
import { BRANDING_LOGO_MARK, brandingColourShown } from './BrandingSettings.logic';
import type { BrandingSettingsProps, BrandingPart as Part } from './BrandingSettings.types';

/** The lines field never opens shorter than two rows (s18-k3), and grows with each line held. */
const LINES_ROWS_AT_LEAST = 2;

const PARTS: readonly Part[] = BRANDING_PARTS;

type PartProps = BrandingSettingsProps & { wide: boolean };

/** Which part's fields the editor shows, across the editor's width. */
export function BrandingPartSwitch({ words, part, onPart }: BrandingSettingsProps) {
  return (
    <SegmentedControl
      className="hg-branding-part-switch"
      ariaLabel={words.edit}
      options={[
        { value: 'logo', label: words.logo },
        { value: 'colour', label: words.colour },
        { value: 'letterhead', label: words.letterhead },
      ]}
      value={part}
      onChange={(value) => {
        const chosen = PARTS.find((option) => option === value);
        if (chosen !== undefined) onPart(chosen);
      }}
    />
  );
}

/** The one part being edited. */
export function BrandingPart(props: PartProps) {
  const { part, words, colour, onColour, document } = props;
  if (part === 'logo') return <LogoPart {...props} />;
  if (part === 'letterhead') return <LetterheadPart {...props} />;
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

/**
 * The logo: a refused file said first, the saved mark kept under it (s18-p, s18-s); the mark on
 * white with Replace and Remove, then the limits. With no logo, the place to add one (s18-k).
 */
function LogoPart(props: PartProps) {
  const { words, document, logoRefusal, onChooseLogo } = props;
  /* A removed logo gives way to the drop surface, where the person adds the next one. */
  const logo = useRef<HTMLDivElement>(null);
  return (
    <div ref={logo} className="hg-branding-logo">
      {logoRefusal === undefined ? null : (
        <Banner kind="validation" tone="warning" title={logoRefusal} density="functional" />
      )}
      {document.logoSrc === undefined ? (
        <Dropzone
          words={words.dropzone}
          label={words.addLogo}
          hint={words.limits}
          accept={COMPANY_LOGO_LIMITS.contentTypes.join(',')}
          multiple={false}
          density="functional"
          onFiles={([chosen]) => {
            if (chosen !== undefined) onChooseLogo(chosen);
          }}
        />
      ) : (
        <HeldLogo
          {...props}
          logoSrc={document.logoSrc}
          dropSurface={focusAfterWithin(logo, 'button, input')}
        />
      )}
    </div>
  );
}

/**
 * A held mark and its two acts. Replace opens the app's picker where it has one; otherwise the
 * browser's own chooser, through a file input no one tabs to — the button is the one control.
 */
function HeldLogo({
  wide,
  words,
  logoSrc,
  onChooseLogo,
  onPickLogo,
  onRemoveLogo,
  dropSurface,
}: PartProps & { logoSrc: string; dropSurface: FocusAfter }) {
  const chooser = useRef<HTMLInputElement>(null);
  const leaving = useFocusAfter(dropSurface);
  const mark = wide ? BRANDING_LOGO_MARK.wide : BRANDING_LOGO_MARK.narrow;
  return (
    <>
      <div className="hg-branding-logo-paper">
        <ImageFrame
          src={logoSrc}
          alt={words.logoAlt}
          missingLabel={words.logoUnavailable}
          missingDetail=""
          words={words.image}
          width={mark.width}
          height={mark.height}
          fit="contain"
          density="functional"
        />
      </div>
      <div className="hg-branding-logo-acts">
        <div className="hg-branding-logo-buttons">
          <Button
            variant="secondary"
            size="sm"
            onClick={onPickLogo ?? (() => chooser.current?.click())}
          >
            {words.replace}
          </Button>
          <Button variant="ghost" size="sm" tone="danger" onClick={leaving(onRemoveLogo)}>
            {words.remove}
          </Button>
        </div>
        <Text variant="caption" color="secondary" className="hg-branding-limits">
          {words.limits}
        </Text>
      </div>
      {onPickLogo === undefined ? (
        <input
          ref={chooser}
          hidden
          type="file"
          accept={COMPANY_LOGO_LIMITS.contentTypes.join(',')}
          onChange={(event) => {
            const file = event.target.files?.[0];
            /* Cleared, so choosing the same file again after a refusal still reports it. */
            event.target.value = '';
            if (file !== undefined) onChooseLogo(pickedFileOf(file));
          }}
        />
      ) : null}
    </>
  );
}

/** The letterhead's three fields, label over field (`LETTERHEAD-PART`). */
function LetterheadPart({ words, letterheadFields: fields }: PartProps) {
  return (
    <div className="hg-branding-letterhead">
      <Input
        label={words.tagline}
        value={fields.tagline}
        onChange={fields.onTagline}
        density="functional"
        {...(fields.taglineError === undefined ? {} : { error: fields.taglineError })}
      />
      <Textarea
        label={words.lines}
        value={fields.lines}
        onChange={fields.onLines}
        placeholder={words.linesPlaceholder}
        helper={words.linesHint}
        rows={Math.max(LINES_ROWS_AT_LEAST, fields.lines.split('\n').length)}
        density="functional"
        {...(fields.linesError === undefined ? {} : { error: fields.linesError })}
      />
      <Input
        label={words.footerNote}
        value={fields.footerNote}
        onChange={fields.onFooterNote}
        density="functional"
        {...(fields.footerNoteError === undefined ? {} : { error: fields.footerNoteError })}
      />
    </div>
  );
}

/** The company's details print from the Business profile: a hairline, then the row that opens it. */
export function BrandingProfile({ words, onOpenProfile }: BrandingSettingsProps) {
  return (
    <div className="hg-branding-profile">
      <div className="hg-branding-hairline" />
      <ListRow
        className="hg-branding-profile-row"
        icon={<ShellGlyph name="building" size="md" tone="secondary" />}
        title={words.profileRow}
        subtitle={words.profileRowFrom}
        trailing={<ShellGlyph name="chevron-right" size="md" />}
        density="functional"
        onClick={onOpenProfile}
      />
    </div>
  );
}
