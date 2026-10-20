import { Text } from '../../primitives/Text/Text';
import { Accordion } from '../Accordion/Accordion';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { EmptyState } from '../EmptyState/EmptyState';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { openedPart, PARTS_DENSITY, profileItems, UNREAD_GLYPH_SIZE } from './CompanyProfile.logic';
import type { CompanyProfileProps, CompanyProfileWords } from './CompanyProfile.types';
import { Letterhead } from './CompanyProfileLetterhead';
import { ProfileSet } from './CompanyProfileSets';

/**
 * The company profile (`SCR-M01-05`). In setup it fills the door's frame; in settings it is the
 * shell's page. Under the door's breakpoint it is the column alone; from it the column stands on
 * the left at the list's wide measure, beside a letterhead that shows what the fields hold
 * (`d-default`, `d-settings`). A profile that could not be read has no letterhead. In settings the
 * pair measures the room the shell's page gives it, not the window: beside the settings side list
 * that room is narrower than the window, and below what the two halves need the column stands
 * alone (`CompanyProfile.css`).
 */
export function CompanyProfile(props: CompanyProfileProps) {
  const { life } = props;
  const profile = <ProfileAndLetterhead {...props} />;
  return life === 'settings' ? <div className="hg-company-profile-room">{profile}</div> : profile;
}

function ProfileAndLetterhead(props: CompanyProfileProps) {
  const { words, life } = props;
  const previewed = words.unread === null;
  return (
    <div
      className="hg-company-profile"
      data-life={life}
      data-preview={previewed ? 'true' : undefined}
    >
      {life === 'settings' ? <SettingsColumn {...props} /> : <SetupColumn {...props} />}
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
 * and the act. A profile that could not be read is one centred message with its retry, and the
 * way on at the foot.
 */
function SetupColumn(props: CompanyProfileProps) {
  const { words, onContinueWithout } = props;
  const { unread } = words;
  if (unread !== null) {
    return (
      <DoorFrame
        trailing={null}
        taskMeasure="list"
        footer={
          unread.onward === null ? undefined : (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              spokenName={unread.onwardSpoken ?? undefined}
              onClick={onContinueWithout}
            >
              {unread.onward}
            </Button>
          )
        }
      >
        <Unread unread={unread} onRetry={props.onRetryRead} />
      </DoorFrame>
    );
  }
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
      footer={<ProfileAct {...props} />}
    >
      <ProfileList {...props} />
    </DoorFrame>
  );
}

/**
 * The page inside the shell (`m-settings`, `d-settings`): the heading, unless the app's bar holds
 * it, its line, the parts at the functional density and the act after them. A profile that could
 * not be read is the message and its retry alone: settings sits in no corridor, so there is
 * nowhere onward to go without it.
 */
function SettingsColumn(props: CompanyProfileProps) {
  const { words, titleInBar = false } = props;
  if (words.unread !== null) {
    return (
      <div className="hg-company-profile-page">
        <Unread unread={words.unread} onRetry={props.onRetryRead} />
      </div>
    );
  }
  return (
    <div className="hg-company-profile-page">
      <div className="hg-company-profile-head">
        {titleInBar ? null : (
          <Text as="h1" variant="h2">
            {words.title}
          </Text>
        )}
        <Text variant="body" color="secondary">
          {words.lede}
        </Text>
      </div>
      <ProfileList {...props} />
      <ProfileAct {...props} />
    </div>
  );
}

/** The five flat parts with one open, or the bars that stand in their place while it is read. */
function ProfileList({
  life,
  words,
  values,
  open,
  onOpen,
  onEdit,
  onChooseSegment,
  onDeclareSize,
  logoPicture,
  onChooseLogo,
}: CompanyProfileProps) {
  return (
    <div className="hg-company-profile-list">
      {words.loading === null ? (
        <Accordion
          density={PARTS_DENSITY[life]}
          items={profileItems(words, open, (part) => (
            <ProfileSet
              part={part}
              words={words}
              values={values}
              onEdit={onEdit}
              onChooseSegment={onChooseSegment}
              onDeclareSize={onDeclareSize}
              density={PARTS_DENSITY[life]}
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
  );
}

/** The act: a failed save said once above it, the way on under it in setup, and its one line. */
function ProfileAct({ words, saving, onSave, onContinueWithout }: CompanyProfileProps) {
  const { act } = words;
  if (act === null) return null;
  return (
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
  );
}

/** A profile that could not be read: one centred message and its retry. */
function Unread({
  unread,
  onRetry,
}: {
  unread: NonNullable<CompanyProfileWords['unread']>;
  onRetry: () => void;
}) {
  return (
    <div className="hg-company-profile-unread">
      <EmptyState
        icon={<UnreadGlyph />}
        title={unread.title}
        description={unread.line}
        action={
          <Button variant="primary" size="lg" onClick={onRetry}>
            {unread.retry}
          </Button>
        }
      />
    </div>
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
      <ShellGlyphMarks name="alert-ring" />
    </svg>
  );
}
