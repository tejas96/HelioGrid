import type { CompanyProfilePart } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text';
import { Dropzone } from '../Dropzone/Dropzone';
import { Input } from '../Input/Input';
import { useCoarsePointer } from '../MapSurface/use-coarse-pointer';
import { NumberField } from '../NumberField/NumberField';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { logoCapture, type ProfileFieldSpec, profileSet, sizeField } from './CompanyProfile.logic';
import type { CompanyProfileProps } from './CompanyProfile.types';

type SetProps = Pick<
  CompanyProfileProps,
  | 'words'
  | 'values'
  | 'onEdit'
  | 'onChooseSegment'
  | 'onDeclareSize'
  | 'logoPicture'
  | 'onChooseLogo'
> & {
  part: CompanyProfilePart;
};

/**
 * One part's fields (`SCR-M01-05`). A line a reader depends on — where a value came from, what was
 * checked, what the part is for — is placed in the secondary ink, never as a field's quiet helper.
 */
export function ProfileSet({
  part,
  words,
  values,
  onEdit,
  onChooseSegment,
  onDeclareSize,
  logoPicture = null,
  onChooseLogo,
}: SetProps) {
  if (part === 'declarations') {
    return (
      <WhatYouSellSet
        words={words.declarations}
        values={values}
        onChooseSegment={onChooseSegment}
        onDeclareSize={onDeclareSize}
      />
    );
  }
  const set = profileSet(part, words, values);
  if (set === null) return null;
  const field = (spec: ProfileFieldSpec) => (
    <Input
      label={spec.label}
      value={spec.value}
      placeholder={spec.example}
      mono={spec.mono}
      error={spec.error ?? undefined}
      onChange={(value) => onEdit(spec.field, value)}
    />
  );
  return (
    <div className="hg-company-profile-set" data-disclosed={set.disclosure !== null}>
      {part === 'identity' && words.logo !== null ? (
        <LogoCapture logo={words.logo} picture={logoPicture} onChoose={onChooseLogo} />
      ) : null}
      {/* One wrapper whether or not the field has a line: a field whose line gives way to its
          error keeps its place in the tree, and so its focus, while a person types. */}
      {set.fields.map((spec) => (
        <div key={spec.field} className="hg-company-profile-pair">
          {field(spec)}
          {spec.line === null ? null : (
            <Text variant="body-sm" color="secondary">
              {spec.line}
            </Text>
          )}
        </div>
      ))}
      {set.disclosure === null ? null : (
        <Text variant="body-sm" color="secondary">
          {set.disclosure}
        </Text>
      )}
      {set.purpose === null ? null : (
        <Text variant="caption" color="secondary">
          {set.purpose}
        </Text>
      )}
    </div>
  );
}

/**
 * Where the company's logo goes, above its name. A finger is told to tap; a pointer can also drop
 * a file, and is told so.
 */
function LogoCapture({
  logo,
  picture,
  onChoose,
}: {
  logo: NonNullable<SetProps['words']['logo']>;
  picture: string | null;
  onChoose: SetProps['onChooseLogo'];
}) {
  const finger = useCoarsePointer();
  return (
    <Dropzone
      {...logoCapture(logo, picture, !finger)}
      onFiles={([chosen]) => {
        if (chosen !== undefined) onChoose?.(chosen);
      }}
    />
  );
}

/** The two declarations of the step before (`m-declarations-open`): the kind of business, then the typical size. */
function WhatYouSellSet({
  words,
  values,
  onChooseSegment,
  onDeclareSize,
}: Pick<SetProps, 'values' | 'onChooseSegment' | 'onDeclareSize'> & {
  words: SetProps['words']['declarations'];
}) {
  return (
    <div className="hg-company-profile-sells">
      <OptionCardGroup
        label={words.group}
        options={[...words.options]}
        value={values.segment ?? undefined}
        onChange={(value) => {
          const chosen = words.options.find((option) => option.value === value);
          if (chosen !== undefined) onChooseSegment(chosen.value);
        }}
      />
      <NumberField {...sizeField(words, values)} onCommit={onDeclareSize} />
    </div>
  );
}
