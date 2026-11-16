'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { CustomerPageScreen } from '@heliogrid/data/react';
import { LINK_TEXT_LIMIT } from '@heliogrid/domain';
import {
  type CustomerSheetWords,
  customerActFailureWords,
  customerSheetWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AfterHint,
  AfterRow,
  AfterRows,
  Chip,
  CustomerSurface,
  EditorSurface,
  type FocusAfter,
  OptionCardGroup,
  ShellGlyph,
  Text,
  Textarea,
  useFormat,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import type { Answering } from './AnswerActs';
import type { FrameCompany } from './CustomerFrame';
import { SendAct } from './SendAct';

const HOUR_DIGITS = 2;

/**
 * The sheets the customer answers on (`F5-43`, `F5-52`…`F5-54`): a sheet on a phone, a dialog at
 * the desktop's room. While an act is out its sheet is inert; a refusal is said in the sheet,
 * where the person acted, and nothing partial was written (`F5-47`).
 */
export function AnswerSheets({
  screen,
  company,
  personName,
  answering,
  accept,
  focusAfter,
}: {
  screen: CustomerPageScreen;
  company: FrameCompany;
  personName: string | null;
  answering: Answering;
  /** Where focus lands once an answer has gone and its sheet with it: the note that says it. */
  focusAfter: FocusAfter;
  /** The Accept sheet's summary; absent on the pages that take no answer. */
  accept?: ReactNode;
}) {
  const t = useTranslate();
  const format = useFormat();
  const words = customerSheetWords(t, personName);
  const { sheet, text, acting } = screen;
  const busy = acting !== null;
  const failure = failureLine(screen, t);

  const send = (label: TranslatedText, glyph?: 'check' | 'phone', quiet = false) => (
    <SendAct
      label={label}
      quiet={quiet}
      disabled={!screen.canSend && !busy}
      loading={busy}
      onSend={screen.send}
      focusAfter={focusAfter}
      {...(glyph === undefined ? {} : { glyph })}
    />
  );
  const surface = (open: boolean, title: TranslatedText, body: ReactNode, footer?: ReactNode) => (
    <EditorSurface
      open={open}
      onClose={screen.close}
      title={title}
      closeLabel={words.close}
      showClose
      desktop="modal"
      dismissible={!busy}
      {...(footer === undefined ? {} : { footer: <InSheet company={company}>{footer}</InSheet> })}
    >
      <InSheet company={company}>
        {body}
        {failure === null ? null : (
          <Text variant="body-sm" color="danger" live>
            {failure}
          </Text>
        )}
      </InSheet>
    </EditorSurface>
  );
  const suggestions = (lines: readonly TranslatedText[]) => (
    <div className="hg-cust-chips">
      {lines.map((line) => (
        <Chip key={line} active={text === line} onClick={() => screen.typed(line)}>
          {line}
        </Chip>
      ))}
    </div>
  );
  const typed = (label: TranslatedText, placeholder: TranslatedText) => (
    <Textarea
      label={label}
      placeholder={placeholder}
      value={text}
      onChange={screen.typed}
      rows={4}
      maxLength={LINK_TEXT_LIMIT}
      disabled={busy}
    />
  );

  return (
    <>
      {surface(
        sheet === 'accept',
        words.accept.title,
        accept,
        <>
          {send(words.accept.confirm, 'check')}
          <Text variant="body-sm" color="secondary" align="center" as="span">
            {words.accept.note}
          </Text>
        </>,
      )}
      {surface(
        sheet === 'more',
        words.more.title,
        <MoreRows screen={screen} answering={answering} words={words} />,
      )}
      {surface(
        sheet === 'ask',
        words.ask.title,
        <>
          {typed(words.ask.label, words.ask.placeholder)}
          {suggestions(words.ask.suggestions)}
        </>,
        send(words.ask.send),
      )}
      {surface(
        sheet === 'call',
        words.call.title,
        <>
          <OptionCardGroup
            ariaLabel={words.call.group}
            columns={1}
            density="functional"
            disabled={busy}
            value={screen.slot}
            onChange={screen.choose}
            options={screen.slots.map((slot) => ({
              value: slot.at,
              title: words.call.slot({
                day: slot.day,
                from: format.time(hourText(slot.fromHour)),
                to: format.time(hourText(slot.toHour)),
              }),
              icon: <ShellGlyph name="clock" />,
            }))}
          />
          <AfterHint glyph="info">{words.call.hint}</AfterHint>
        </>,
        send(words.call.send, 'phone'),
      )}
      {surface(
        sheet === 'change',
        words.change.title,
        <>
          {suggestions(words.change.suggestions)}
          {typed(words.change.label, words.change.placeholder)}
        </>,
        send(words.change.send),
      )}
      {surface(
        sheet === 'decline',
        words.decline.title,
        <>
          <Text variant="field-label" color="secondary">
            {words.decline.why}
          </Text>
          {suggestions(words.decline.reasons)}
        </>,
        <>
          {send(words.decline.confirm, undefined, true)}
          <Text variant="body-sm" color="secondary" align="center" as="span">
            {words.decline.note}
          </Text>
        </>,
      )}
    </>
  );
}

function hourText(hour: number): string {
  return `${String(hour).padStart(HOUR_DIGITS, '0')}:00`;
}

function failureLine(
  screen: CustomerPageScreen,
  t: ReturnType<typeof useTranslate>,
): TranslatedText | null {
  const { failure } = screen;
  if (failure === null) return null;
  if (failure.kind === 'failed') {
    return customerActFailureWords(t, {
      kind: 'failed',
      offline: failure.failure === 'no_connection',
    });
  }
  return customerActFailureWords(t, failure);
}

/** The four ways to ask; a change and a decline only while the version still takes its answer. */
function MoreRows({
  screen,
  answering,
  words,
}: {
  screen: CustomerPageScreen;
  answering: Answering;
  words: CustomerSheetWords;
}) {
  const { more } = words;
  return (
    <AfterRows>
      {answering.mayAsk ? (
        <>
          <AfterRow
            glyph="chat"
            hue="accent"
            title={more.ask}
            line={more.askLine}
            onOpen={() => screen.open('ask')}
          />
          <AfterRow
            glyph="phone"
            hue="accent"
            title={more.call}
            line={more.callLine}
            onOpen={() => screen.open('call')}
          />
        </>
      ) : null}
      {answering.mayRespond ? (
        <>
          <AfterRow
            glyph="pencil"
            hue="accent"
            title={more.change}
            line={more.changeLine}
            onOpen={() => screen.open('change')}
          />
          <AfterRow
            glyph="close"
            hue="neutral"
            title={more.decline}
            line={more.declineLine}
            onOpen={() => screen.open('decline')}
          />
        </>
      ) : null}
    </AfterRows>
  );
}

/**
 * A sheet leaves the page through the portal, and with it the company's surface: its content is
 * dressed again here, so a button in a sheet is the company's colour as on the page.
 */
function InSheet({ company, children }: { company: FrameCompany; children: ReactNode }) {
  return (
    <div className="hg-cust-in-sheet">
      <CustomerSurface
        {...(company.brandColour ? { brandColor: company.brandColour } : {})}
        tenantName={company.name}
      >
        <div className="hg-cust-sheet-body">{children}</div>
      </CustomerSurface>
    </div>
  );
}
