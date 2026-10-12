import { Text } from '../../primitives/Text/Text';
import { Accordion } from '../Accordion/Accordion';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { openedPart, profileItems, UNREAD_GLYPH, UNREAD_GLYPH_SIZE } from './CompanyProfile.logic';
import type { CompanyProfileProps } from './CompanyProfile.types';
import { ProfileSet } from './CompanyProfileSets';

/**
 * The company profile in the door's frame under its breakpoint (`SCR-M01-05` at 375): the heading
 * and its line, the five flat parts with one open, and the act held at the foot. While the record
 * is read, bars stand in the list's place; a profile that could not be read is one centred message
 * with its retry, and the way on at the foot.
 */
export function CompanyProfile({
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
