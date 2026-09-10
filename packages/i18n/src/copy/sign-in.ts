/**
 * Every sentence the front door says (`SCR-M01-01`, all states), authored once for both
 * platforms (Law 11) and translated in three languages (`F3-07`). A screen reads a KEY here and
 * never types a sentence; the export's frames are the source of the words, and the two places
 * they were corrected (a code lasts 5 minutes, `M01-05`; the market's digit count, never a
 * demonym) are recorded in `T-M01-001`. Values in braces are the screen's to fill.
 */
export const SIGN_IN = {
  signIn: /*i18n*/ { id: 'Sign in' },
  intro: /*i18n*/ {
    id: 'Your mobile number is your HelioGrid account. There is no password to remember.',
  },
  mobileNumber: /*i18n*/ { id: 'Mobile number' },
  willSendBySms: /*i18n*/ { id: "We'll send a code by SMS to this number." },
  lockedWhileSending: /*i18n*/ { id: 'Locked while the code is sent.' },
  digitsMismatch: /*i18n*/ { id: 'That is {typed} digits. A mobile number here has {needed}.' },
  sendCode: /*i18n*/ { id: 'Send code' },
  sendingTheCode: /*i18n*/ { id: 'Sending the code' },
  newCompany: /*i18n*/ { id: 'New company on HelioGrid?' },
  createCompany: /*i18n*/ { id: 'Create a company account' },
  changeLanguage: /*i18n*/ { id: 'Change language' },
  changeNumber: /*i18n*/ { id: 'Change number' },
  codeLabel: /*i18n*/ { id: '{n}-digit code' },
  enterTheCode: /*i18n*/ { id: 'Enter the code' },
  sentBySmsTo: /*i18n*/ { id: 'Sent by SMS to' },
  triedBySmsTo: /*i18n*/ { id: 'We tried to send by SMS to' },
  triedToCall: /*i18n*/ { id: 'We tried to call' },
  weReadOutTo: /*i18n*/ { id: 'We read the code out to' },
  weCallAndReadTo: /*i18n*/ { id: 'We call and read the code out to' },
  checkedFor: /*i18n*/ { id: 'The code we checked was for' },
  lockedFor: /*i18n*/ { id: 'Locked for' },
  verifyAndSignIn: /*i18n*/ { id: 'Verify and sign in' },
  sendNewCode: /*i18n*/ { id: 'Send a new code' },
  sendItAgain: /*i18n*/ { id: 'Send it again' },
  callAgain: /*i18n*/ { id: 'Call again' },
  sendSmsAgain: /*i18n*/ { id: 'Send the SMS again' },
  resendCode: /*i18n*/ { id: 'Resend code' },
  getCodeByCall: /*i18n*/ { id: 'Get the code by call' },
  callMeWithCode: /*i18n*/ { id: 'Call me with the code' },
  weCallNote: /*i18n*/ { id: 'We call {phone} and read it out.' },
  tryAgain: /*i18n*/ { id: 'Try again' },
  noCodeYet: /*i18n*/ { id: 'No code to type yet.' },
  nothingUntilNew: /*i18n*/ { id: 'Nothing to type until a new code is sent.' },
  lockedHelper: /*i18n*/ { id: 'Locked.' },
  codeWasFine: /*i18n*/ { id: 'Your code was fine.' },
  sentJustNow: /*i18n*/ { id: 'Sent just now. SMS is the only channel.' },
  sentMomentAgo: /*i18n*/ { id: 'Sent a moment ago.' },
  pasteWhole: /*i18n*/ { id: 'Paste the whole code if that is easier — it fills every box.' },
  answerCall: /*i18n*/ { id: 'Answer the call and type what you hear.' },
  filledFromSms: /*i18n*/ { id: 'Filled from the SMS on this phone. Check it, or type over it.' },
  codeFilledTitle: /*i18n*/ { id: 'Code filled from your SMS' },
  onlySomePhones: /*i18n*/ {
    id: 'Only some phones fill this in. On the rest it is typed, and nothing else about the step changes.',
  },
  waitFirst: /*i18n*/ {
    id: 'You can ask for a new code in {seconds} s. The gap is HelioGrid’s, so a message still in flight is not cancelled by a second one.',
  },
  waitAgain: /*i18n*/ {
    id: 'You can ask for a new code in {seconds} s. HelioGrid waits {gap} s so two messages do not cross.',
  },
  waitShort: /*i18n*/ { id: 'You can ask for a new code in {seconds} s.' },
  codeWorksFor: /*i18n*/ { id: 'A code works for {codeMinutes} minutes.' },
  waitStopsOnFailure: /*i18n*/ {
    id: 'This wait stops existing the moment the network confirms the SMS failed.',
  },
  wrongTitle: /*i18n*/ { id: 'That code did not match' },
  enterAllDigits: /*i18n*/ { id: 'Enter all {n} digits.' },
  wrongError: /*i18n*/ {
    id: 'That is not the code we sent. Check the last SMS, or ask for a new one.',
  },
  triesLeft: /*i18n*/ {
    id: '{left, plural, one {# try left} other {# tries left}} on this code. HelioGrid invalidates a code after {tries} wrong tries, and then you need a new one.',
  },
  expiredTitle: /*i18n*/ { id: 'That code has expired' },
  expiredBlockTitle: /*i18n*/ { id: 'A code lasts {codeMinutes} minutes' },
  expiredBlockBody: /*i18n*/ {
    id: 'This one is past that, so it will not work even typed correctly. HelioGrid’s limit, not your network’s.',
  },
  usedUpTitle: /*i18n*/ { id: 'That code is used up' },
  usedUpBlockTitle: /*i18n*/ { id: '{tries} wrong tries use a code up' },
  usedUpBlockBody: /*i18n*/ {
    id: 'This one has had them, so it will not work even typed correctly. HelioGrid’s rule, not your network’s.',
  },
  callFoot: /*i18n*/ {
    id: 'You asked for this call. HelioGrid never switches to one on its own — when SMS fails it says so instead.',
  },
  notSentTitle: /*i18n*/ { id: 'The code did not send' },
  notSentBlockTitle: /*i18n*/ { id: 'The SMS network turned it away' },
  notSentBlockBody: /*i18n*/ { id: 'Nothing is on its way, so there is nothing to wait for.' },
  callNotPlacedTitle: /*i18n*/ { id: 'The call did not go through' },
  callNotPlacedBlockTitle: /*i18n*/ { id: 'The phone network turned it away' },
  notSentFoot: /*i18n*/ {
    id: 'No countdown here: the {gap} s gap exists to stop two messages crossing and nothing is in flight.',
  },
  requestFailedTitle: /*i18n*/ { id: 'We could not send the code' },
  couldNotCallTitle: /*i18n*/ { id: 'We could not place the call' },
  ourSideFailed: /*i18n*/ { id: 'Something on our side failed' },
  requestFailedBody: /*i18n*/ {
    id: 'Not your number — the step after it did not complete. Try again.',
  },
  capTitle: /*i18n*/ { id: 'No more codes for {windowMinutes} minutes' },
  capBlockTitle: /*i18n*/ { id: '{perWindow} codes in {windowMinutes} minutes is the limit' },
  capBlockBody: /*i18n*/ {
    id: 'The cap holds even when sending fails — {perWindow} every {windowMinutes} minutes, {day} a day for one number. HelioGrid’s rule.',
  },
  capResendReason: /*i18n*/ {
    id: 'Closed until the {windowMinutes} minutes are up. Nothing shortens it.',
  },
  capFoot: /*i18n*/ {
    id: 'Nothing is retried behind you, and nothing about this is your network’s doing.',
  },
  lockedTitle: /*i18n*/ { id: 'This number is locked for {lockMinutes} minutes' },
  lockedBlockTitle: /*i18n*/ { id: '{chain} codes were invalidated in a row' },
  lockedBlockBody: /*i18n*/ {
    id: '{tries} wrong tries invalidate a code, and three invalidated codes lock the number. HelioGrid’s rule, and {lockMinutes} minutes is the wait.',
  },
  lockedResendReason: /*i18n*/ { id: 'Closed while the number is locked.' },
  lockedFoot: /*i18n*/ {
    id: 'The wait is the whole remedy — nothing you or your admin does shortens it.',
  },
  authErrorTitle: /*i18n*/ { id: 'We could not sign you in' },
  authErrorBody: /*i18n*/ {
    id: 'Not your number and not your code — the step after them did not complete.',
  },
  authErrorFoot: /*i18n*/ {
    id: 'No error code reaches a field user. If it keeps failing, your company admin can raise it with HelioGrid.',
  },
  youAreIn: /*i18n*/ { id: 'You are in' },
  takingYouTo: /*i18n*/ { id: 'Taking you to {destination}' },
  companySetup: /*i18n*/ { id: 'company setup' },
  switchTitle: /*i18n*/ { id: 'Signing in as {name} discards {count} photographs' },
  switchSubtitle: /*i18n*/ {
    id: 'They were captured on this phone on {date} and have not reached HelioGrid yet. Signing in as someone else deletes them, and this cannot be undone.',
  },
  switchBlockTitle: /*i18n*/ { id: 'This is the one thing in HelioGrid that cannot be got back' },
  switchBlockBody: /*i18n*/ {
    id: 'A rep must never reach another rep’s customer photographs, so nothing captured survives the identity that captured it.',
  },
  uploadFirst: /*i18n*/ { id: 'Upload them first' },
  uploadArrivesLater: /*i18n*/ {
    id: 'Uploading held photographs arrives with the survey capture.',
  },
  signInAndDiscard: /*i18n*/ { id: 'Sign in and discard' },
} as const;

export type SignInCopyKey = keyof typeof SIGN_IN;
