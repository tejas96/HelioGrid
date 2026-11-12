/**
 * Lead Detail's sheets (`packages/ui`'s `LeadDetailSheet` words): Log activity, Book visit,
 * Snooze, Disqualify, Mark lost, Junk, a call-back, the message to copy and a contact, with the field words
 * every form shares and how a send that came back undone says why.
 */
import type { ContactRoleLabel } from '@heliogrid/contracts';
import type { LeadActFailure, LeadStage, LostReason } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import {
  CALL_OUTCOME_WORD,
  DISQUALIFY_REASON_WORD,
  LEAD_STAGE_WORD,
  LOST_REASON_WORD,
} from './crm-vocabulary';
import { datePickerWords } from './date-picker';
import { leadActFailureWords } from './lead-act-failure';
import { LEAD_DETAIL } from './lead-detail';
import { contactRoleWord } from './lead-detail-parts';
import { lastContactWord } from './lead-marks';
import { phoneFieldWords } from './phone-field';
import { SHELL } from './shell';
import { timeFieldWords } from './time-field';

type T = Translator['t'];

const SHEETS = {
  detailsTitle: /*i18n*/ { id: 'Edit details' },
  detailsLine: /*i18n*/ { id: 'The name and city, as the customer gives them.' },
  detailsSend: /*i18n*/ { id: 'Save' },
  city: /*i18n*/ { id: 'City' },
  logTitle: LEAD_DETAIL.logActivity,
  logLine: /*i18n*/ { id: 'What happened, while it is fresh. It goes on the timeline.' },
  logCall: /*i18n*/ { id: 'Log call' },
  call: LEAD_DETAIL.call,
  note: /*i18n*/ { id: 'Note' },
  kindLabel: /*i18n*/ { id: 'What to log' },
  outcomeLabel: /*i18n*/ { id: 'How did the call end?' },
  noAnswerLine: /*i18n*/ { id: 'A retry is set inside the calling window.' },
  notePlaceholder: /*i18n*/ { id: 'What was said' },
  addNote: /*i18n*/ { id: 'Add note' },
  visitTitle: /*i18n*/ { id: 'Book a site visit' },
  visitLine: /*i18n*/ { id: 'The lead moves to Survey, and the confirmation is ready to copy.' },
  rescheduleTitle: /*i18n*/ { id: 'Reschedule the visit' },
  rescheduleLine: /*i18n*/ {
    id: 'For a no-show: a new visit replaces this one, and one reminder is ready to copy.',
  },
  reschedule: /*i18n*/ { id: 'Reschedule' },
  date: /*i18n*/ { id: 'Date' },
  time: /*i18n*/ { id: 'Time' },
  surveyor: /*i18n*/ { id: 'Surveyor' },
  surveyorPick: /*i18n*/ { id: 'Pick who visits' },
  surveyorsLoading: /*i18n*/ { id: 'Loading who can survey' },
  surveyorsFailed: /*i18n*/ { id: 'Couldn’t load who can survey' },
  noSurveyors: /*i18n*/ { id: 'No one can survey yet. Give someone a survey role in Team.' },
  address: /*i18n*/ { id: 'Confirmed address' },
  addressHint: /*i18n*/ { id: 'As the customer confirmed it on the call.' },
  snoozeTitle: /*i18n*/ { id: 'Snooze until' },
  snoozeLine: /*i18n*/ { id: 'It comes back at 09:00 that day, with a follow-up task.' },
  wakeOn: /*i18n*/ { id: 'Wake on' },
  disqualifyTitle: /*i18n*/ { id: 'Why disqualify?' },
  disqualifyLine: /*i18n*/ { id: 'A reason is needed. It stays on the record.' },
  reasonLabel: /*i18n*/ { id: 'Reason' },
  wrongNumberLine: /*i18n*/ { id: 'No one will be offered a call to this number again.' },
  lostTitle: /*i18n*/ { id: 'Why was it lost?' },
  lostLine: /*i18n*/ { id: 'A reason is needed. You can reopen the lead later.' },
  /* The same message My Day's next-up hero says beside a lead's name. */
  bill: /*i18n*/ { id: 'Bill {amount} a month' },
  bringBack: /*i18n*/ { id: 'Bring it back in' },
  inAWeek: /*i18n*/ { id: '1 week' },
  inAMonth: /*i18n*/ { id: '1 month' },
  inThreeMonths: /*i18n*/ { id: '3 months' },
  pickDate: /*i18n*/ { id: 'Pick date' },
  comesBackOn: /*i18n*/ { id: 'Comes back on' },
  comesBack: /*i18n*/ { id: 'Comes back to Today on {day} · {time} with a follow-up.' },
  notInterestedLine: /*i18n*/ { id: 'No call task is raised for this lead for six months.' },
  markLost: LEAD_DETAIL.markLost,
  markLostAs: /*i18n*/ { id: 'Mark lost · {reason}' },
  junkTitle: /*i18n*/ { id: 'Bin this lead as junk?' },
  junkLine: /*i18n*/ {
    id: 'It leaves every list and queue. Search still finds it, and it can be reopened.',
  },
  junkSend: /*i18n*/ { id: 'Junk it' },
  callBackTitle: /*i18n*/ { id: 'Add a call-back' },
  callBackLine: /*i18n*/ { id: 'A call task for the lead’s owner, due when you say.' },
  callBackSend: /*i18n*/ { id: 'Add call-back' },
  messageTitle: /*i18n*/ { id: 'Message to copy' },
  messageLine: /*i18n*/ { id: 'Send it from your own phone. Nothing is sent from here.' },
  templateLabel: /*i18n*/ { id: 'Which message' },
  followUp: /*i18n*/ { id: 'Follow-up' },
  visitConfirmation: /*i18n*/ { id: 'Visit confirmation' },
  composing: /*i18n*/ { id: 'Writing the message' },
  composeFailed: /*i18n*/ { id: 'Couldn’t write the message' },
  copy: /*i18n*/ { id: 'Copy' },
  copyOrShare: /*i18n*/ { id: 'Copy or share' },
  copied: /*i18n*/ { id: 'Copied. Paste it in your own app.' },
  handedOn: /*i18n*/ { id: 'Handed to your phone. Nothing is sent from here.' },
  contactTitle: /*i18n*/ { id: 'Add a contact' },
  contactEditTitle: /*i18n*/ { id: 'Edit contact' },
  contactLine: /*i18n*/ { id: 'Their number joins this customer, so it is found when they call.' },
  contactSend: /*i18n*/ { id: 'Save contact' },
  name: /*i18n*/ { id: 'Name' },
  phone: /*i18n*/ { id: 'Phone' },
  role: /*i18n*/ { id: 'Role' },
  rolePick: /*i18n*/ { id: 'Pick a role' },
  noRole: /*i18n*/ { id: 'No role' },
  labelsFailed: /*i18n*/ { id: 'Couldn’t load the roles' },
  newRole: /*i18n*/ { id: 'A role of your own' },
  addRole: /*i18n*/ { id: 'Add role' },
  takenTitle: /*i18n*/ { id: 'This number is already another customer’s' },
  takenLine: /*i18n*/ { id: 'Nothing was saved. If they are one family, merge the two customers.' },
  outside: /*i18n*/ { id: 'A customer outside your list' },
  ownerLabel: /*i18n*/ { id: 'Owner' },
  stageLabel: /*i18n*/ { id: 'Stage' },
  lastContactLabel: /*i18n*/ { id: 'Last contact' },
  merge: /*i18n*/ { id: 'Merge the two customers' },
} as const;

/** Every form's words — `copyAct` is the message's act on this platform: copy, or copy or share. */
export function leadActSheetWords(t: T, copyAct: 'copy' | 'share') {
  return {
    log: {
      title: t(SHEETS.logTitle),
      line: t(SHEETS.logLine),
      send: t(SHEETS.logCall),
      call: t(SHEETS.call),
      note: t(SHEETS.note),
      kindLabel: t(SHEETS.kindLabel),
      outcomeLabel: t(SHEETS.outcomeLabel),
      outcome: {
        answered: t(CALL_OUTCOME_WORD.answered),
        no_answer: t(CALL_OUTCOME_WORD.no_answer),
      },
      noAnswerLine: t(SHEETS.noAnswerLine),
      noteLabel: t(SHEETS.note),
      notePlaceholder: t(SHEETS.notePlaceholder),
      sendNote: t(SHEETS.addNote),
    },
    visit: (mode: 'book' | 'reschedule') => ({
      title: t(mode === 'book' ? SHEETS.visitTitle : SHEETS.rescheduleTitle),
      line: t(mode === 'book' ? SHEETS.visitLine : SHEETS.rescheduleLine),
      send: t(mode === 'book' ? LEAD_DETAIL.bookVisit : SHEETS.reschedule),
      date: t(SHEETS.date),
      time: t(SHEETS.time),
      surveyor: t(SHEETS.surveyor),
      surveyorPick: t(SHEETS.surveyorPick),
      surveyorsLoading: t(SHEETS.surveyorsLoading),
      surveyorsFailed: t(SHEETS.surveyorsFailed),
      retry: t(SHELL.tryAgain),
      noSurveyors: t(SHEETS.noSurveyors),
      address: t(SHEETS.address),
      addressHint: t(SHEETS.addressHint),
      close: t(SHELL.close),
    }),
    snooze: {
      title: t(SHEETS.snoozeTitle),
      line: t(SHEETS.snoozeLine),
      send: t(LEAD_DETAIL.snooze),
      wakeOn: t(SHEETS.wakeOn),
    },
    disqualify: {
      title: t(SHEETS.disqualifyTitle),
      line: t(SHEETS.disqualifyLine),
      send: t(LEAD_DETAIL.disqualify),
      reasonLabel: t(SHEETS.reasonLabel),
      reason: {
        renting: t(DISQUALIFY_REASON_WORD.renting),
        budget: t(DISQUALIFY_REASON_WORD.budget),
        not_interested: t(DISQUALIFY_REASON_WORD.not_interested),
        unreachable: t(DISQUALIFY_REASON_WORD.unreachable),
        already_installed: t(DISQUALIFY_REASON_WORD.already_installed),
        wrong_number: t(DISQUALIFY_REASON_WORD.wrong_number),
      },
      wrongNumberLine: t(SHEETS.wrongNumberLine),
    },
    lost: {
      title: t(SHEETS.lostTitle),
      line: t(SHEETS.lostLine),
      reasonLabel: t(SHEETS.reasonLabel),
      reason: {
        price: t(LOST_REASON_WORD.price),
        chose_competitor: t(LOST_REASON_WORD.chose_competitor),
        postponed: t(LOST_REASON_WORD.postponed),
        not_reachable: t(LOST_REASON_WORD.not_reachable),
        roof_unsuitable: t(LOST_REASON_WORD.roof_unsuitable),
        financing_failed: t(LOST_REASON_WORD.financing_failed),
        not_interested: t(LOST_REASON_WORD.not_interested),
      },
      bill: (amount: string) => t(SHEETS.bill, { amount }),
      noName: t(LEAD_DETAIL.noName),
      whenLabel: t(SHEETS.bringBack),
      span: {
        week: t(SHEETS.inAWeek),
        month: t(SHEETS.inAMonth),
        threeMonths: t(SHEETS.inThreeMonths),
        pick: t(SHEETS.pickDate),
      },
      dayLabel: t(SHEETS.comesBackOn),
      comesBack: (day: string, time: string) => t(SHEETS.comesBack, { day, time }),
      notInterestedLine: t(SHEETS.notInterestedLine),
      send: (reason: LostReason | null) =>
        reason === null
          ? t(SHEETS.markLost)
          : t(SHEETS.markLostAs, { reason: t(LOST_REASON_WORD[reason]) }),
    },
    junk: { title: t(SHEETS.junkTitle), line: t(SHEETS.junkLine), send: t(SHEETS.junkSend) },
    callBack: {
      title: t(SHEETS.callBackTitle),
      line: t(SHEETS.callBackLine),
      send: t(SHEETS.callBackSend),
      date: t(SHEETS.date),
      time: t(SHEETS.time),
    },
    message: {
      title: t(SHEETS.messageTitle),
      line: t(SHEETS.messageLine),
      templateLabel: t(SHEETS.templateLabel),
      loading: t(SHEETS.composing),
      failed: t(SHEETS.composeFailed),
      retry: t(SHELL.tryAgain),
      send: t(copyAct === 'copy' ? SHEETS.copy : SHEETS.copyOrShare),
      handedOn: t(copyAct === 'copy' ? SHEETS.copied : SHEETS.handedOn),
    },
    template: {
      follow_up_nudge: t(SHEETS.followUp),
      visit_confirmation: t(SHEETS.visitConfirmation),
    },
    contact: {
      title: t(SHEETS.contactTitle),
      editTitle: t(SHEETS.contactEditTitle),
      line: t(SHEETS.contactLine),
      send: t(SHEETS.contactSend),
      name: t(SHEETS.name),
      phone: t(SHEETS.phone),
      role: t(SHEETS.role),
      rolePick: t(SHEETS.rolePick),
      noRole: t(SHEETS.noRole),
      labelsFailed: t(SHEETS.labelsFailed),
      retry: t(SHELL.tryAgain),
      newRole: t(SHEETS.newRole),
      addRole: t(SHEETS.addRole),
      close: t(SHELL.close),
      takenTitle: t(SHEETS.takenTitle),
      takenLine: t(SHEETS.takenLine),
      outside: t(SHEETS.outside),
      noName: t(LEAD_DETAIL.noName),
      ownerLabel: t(SHEETS.ownerLabel),
      noOwner: t(LEAD_DETAIL.noOwner),
      stageLabel: t(SHEETS.stageLabel),
      stage: (stage: LeadStage) => t(LEAD_STAGE_WORD[stage]),
      lastContactLabel: t(SHEETS.lastContactLabel),
      merge: t(SHEETS.merge),
    },
    details: {
      title: t(SHEETS.detailsTitle),
      line: t(SHEETS.detailsLine),
      send: t(SHEETS.detailsSend),
      name: t(SHEETS.name),
      city: t(SHEETS.city),
    },
  };
}

/**
 * The whole sheet's words over Lead Detail: every form's, the field words they share, and how a
 * send that came back undone, a role label and the other record's last contact are said.
 * `handOn` is the message's act on this platform: copy, or copy or share.
 */
export function leadDetailSheetWords(t: T, handOn: 'copy' | 'share') {
  return {
    forms: leadActSheetWords(t, handOn),
    failure: (failed: LeadActFailure) => leadActFailureWords(t, failed),
    role: (label: ContactRoleLabel) => contactRoleWord(t, label),
    lastContact: (elapsedMs: number | null) => lastContactWord(t, elapsedMs),
    close: t(SHELL.close),
    fields: { date: datePickerWords(t), time: timeFieldWords(t), phone: phoneFieldWords(t) },
  };
}
