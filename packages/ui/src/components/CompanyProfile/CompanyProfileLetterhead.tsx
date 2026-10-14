import { Text } from '../../primitives/Text/Text';
import { BrandBloom } from '../BrandBloom/BrandBloom';
import { LETTER_PARAGRAPHS, LETTERHEAD_BLOOM_SIZE } from './CompanyProfile.logic';
import type { CompanyProfileWords } from './CompanyProfile.types';

/**
 * Decorative: every value on it is a field beside it, so it is hidden from a screen reader and
 * holds no control. A line with nothing to show is a bar; the tile shows the logo's picture once
 * the screen has one, and a word until then.
 */
export function Letterhead({
  words,
  picture,
  loading,
}: {
  words: CompanyProfileWords['letterhead'];
  picture: string | null;
  loading: boolean;
}) {
  return (
    <aside className="hg-company-profile-preview" aria-hidden="true">
      <BrandBloom size={LETTERHEAD_BLOOM_SIZE} />
      <Text variant="overline" color="secondary" className="hg-company-profile-overline">
        {words.overline}
      </Text>
      <div className="hg-company-profile-sheet" data-loading={loading ? 'true' : undefined}>
        <div className="hg-company-profile-sheet-head">
          <span className="hg-company-profile-sheet-logo">
            {picture === null ? (
              <Text variant="caption" color="secondary">
                {words.logo}
              </Text>
            ) : (
              <img className="hg-company-profile-sheet-picture" src={picture} alt="" />
            )}
          </span>
          <div className="hg-company-profile-sheet-name">
            {words.name === '' ? (
              <Bar />
            ) : (
              <Text variant="body" bold>
                {words.name}
              </Text>
            )}
            {words.address === '' ? (
              <Bar />
            ) : (
              <Text variant="caption" color="secondary">
                {words.address}
              </Text>
            )}
          </div>
        </div>
        <span className="hg-company-profile-sheet-rule" />
        <div className="hg-company-profile-sheet-facts">
          <Text variant="caption" color="secondary">
            {words.taxLabel}
          </Text>
          {words.tax === null ? (
            <Bar />
          ) : (
            <Text variant="mono" color={words.tax.owed ? 'danger' : 'primary'}>
              {words.tax.value}
            </Text>
          )}
          <Text variant="caption" color="secondary">
            {words.bank}
          </Text>
          {words.bankLine === null ? <Bar /> : <Text variant="caption">{words.bankLine}</Text>}
        </div>
        {LETTER_PARAGRAPHS.map((lines) => (
          <div key={lines} className="hg-company-profile-sheet-lines">
            {Array.from({ length: lines }, (_, line) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: identical bars that never reorder
              <Bar key={line} />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Bar() {
  return <span className="hg-company-profile-bar" />;
}
