import { Text } from '../../primitives/Text/Text';
import { Accordion } from '../Accordion/Accordion';
import { BrandBloom } from '../BrandBloom/BrandBloom';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import {
  LETTER_PARAGRAPHS,
  LETTERHEAD_BLOOM_SIZE,
  openedPart,
  profileItems,
  UNREAD_GLYPH,
  UNREAD_GLYPH_SIZE,
} from './CompanyProfile.logic';
import type { CompanyProfileProps, CompanyProfileWords } from './CompanyProfile.types';
import { ProfileSet } from './CompanyProfileSets';

/**
 * The company profile (`SCR-M01-05`). Under the door's breakpoint it is the column alone; from it
 * the column stands on the left at the list's wide measure, beside a letterhead that shows what
 * the fields hold (`d-default`). A profile that could not be read has no letterhead.
 */
export function CompanyProfile(props: CompanyProfileProps) {
  const { words } = props;
  const previewed = words.unread === null;
  return (
    <div className="hg-company-profile" data-preview={previewed ? 'true' : undefined}>
      <ProfileColumn {...props} />
      {previewed ? (
        <Letterhead
          words={words.letterhead}
          picture={props.logoPicture ?? null}
          loading={words.loading !== null}
        />
      ) : null}
    </div>
  );
}

/**
 * The column in the door's frame: the heading and its line, the five flat parts with one open,
 * and the act. While the record is read, bars stand in the list's place; a profile that could not
 * be read is one centred message with its retry, and the way on at the foot.
 */
function ProfileColumn({
  words,
  values,
  open,
  onOpen,
  onEdit,
  onChooseSegment,
  onDeclareSize,
  saving,
  onSave,
  onRetryRead,
  onContinueWithout,
  logoPicture,
  onChooseLogo,
}: CompanyProfileProps) {
  if (words.unread !== null) {
    return (
      <DoorFrame
        trailing={null}
        taskMeasure="list"
        footer={
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            spokenName={words.unread.onwardSpoken}
            onClick={onContinueWithout}
          >
            {words.unread.onward}
          </Button>
        }
      >
        <div className="hg-company-profile-unread">
          <EmptyState
            icon={<UnreadGlyph />}
            title={words.unread.title}
            description={words.unread.line}
            action={
              <Button variant="primary" size="lg" onClick={onRetryRead}>
                {words.unread.retry}
              </Button>
            }
          />
        </div>
      </DoorFrame>
    );
  }

  const { act } = words;
  return (
    <DoorFrame
      trailing={null}
      taskMeasure="list"
      identity={
        <div className="hg-company-profile-head">
          <Text variant="h1">{words.title}</Text>
          <Text variant="body-lg" color="secondary">
            {words.lede}
          </Text>
        </div>
      }
      footer={
        act === null ? undefined : (
          <div className="hg-company-profile-act">
            {act.alert === null ? null : (
              <Text variant="caption" color="danger" align="center" live>
                {act.alert}
              </Text>
            )}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={act.waiting !== null}
              disabledReason={act.waiting ?? undefined}
              spokenName={act.primarySpoken}
              onClick={onSave}
            >
              {act.primary}
            </Button>
            {act.secondary === null ? null : (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={saving}
                spokenName={act.secondarySpoken ?? undefined}
                onClick={onContinueWithout}
              >
                {act.secondary}
              </Button>
            )}
            {act.line === null ? null : (
              <Text variant="caption" color="secondary" align="center">
                {act.line}
              </Text>
            )}
          </div>
        )
      }
    >
      <div className="hg-company-profile-list">
        {words.loading === null ? (
          <Accordion
            items={profileItems(words, open, (part) => (
              <ProfileSet
                part={part}
                words={words}
                values={values}
                onEdit={onEdit}
                onChooseSegment={onChooseSegment}
                onDeclareSize={onDeclareSize}
                logoPicture={logoPicture}
                onChooseLogo={onChooseLogo}
              />
            ))}
            value={open}
            onChange={(reported) => onOpen(openedPart(reported))}
          />
        ) : (
          <LoadingBars label={words.loading} bars={['panel', 'row', 'row', 'row', 'row']} />
        )}
      </div>
    </DoorFrame>
  );
}

/** Decorative: the message beside it carries the meaning. */
function UnreadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={UNREAD_GLYPH_SIZE}
      height={UNREAD_GLYPH_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {UNREAD_GLYPH.map((mark) =>
        mark.kind === 'path' ? (
          <path key={mark.d} d={mark.d} />
        ) : (
          <circle key={`${mark.cx}-${mark.cy}`} cx={mark.cx} cy={mark.cy} r={mark.r} />
        ),
      )}
    </svg>
  );
}

/**
 * Decorative: every value on it is a field beside it, so it is hidden from a screen reader and
 * holds no control. A line with nothing to show is a bar; the tile shows the logo's picture once
 * the screen has one, and a word until then.
 */
function Letterhead({
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
