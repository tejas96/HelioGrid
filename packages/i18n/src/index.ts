/**
 * @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare React Native.
 *
 * This entry is REACT-FREE. Four entries, and the split is the point:
 *   `.`      identity-adjacent metadata, catalog loading, and `createTranslator` for
 *            isolated server/background/export work.
 *   `./react` the provider, the hooks, and the Lingui component API.
 *   `./rn`    Hermes Intl polyfills — global side effects that must never enter a web bundle.
 *
 * The language SET is not re-exported: it lives in `@heliogrid/contracts`
 * (`UI_LANGUAGES` / `UiLanguage`), and restating it here would be the second list this
 * package exists to prevent.
 */

export * from './copy/activity-stream';
export * from './copy/actor-class';
export { allocationMeterWords, allocationRefusal, allocationSentence } from './copy/allocation';
export type { ApiErrorLike, AttemptFailureLike } from './copy/api-error';
export { apiErrorMessageId, apiErrorRef, attemptFailureMessageId } from './copy/api-error';
export * from './copy/assign-roles';
export * from './copy/audio-player';
export { shownInNote } from './copy/authored-content';
export * from './copy/banner';
export { billingCapabilityName, billingNoticeWords } from './copy/billing-notices';
export * from './copy/block';
export type { BrandColourFieldWords } from './copy/brand-colour-field';
export { brandColourFieldWords } from './copy/brand-colour-field';
export type { BrandingFormats, BrandingPageFacts, BrandingWords } from './copy/branding';
export {
  brandingLogoRefusal,
  brandingPageWords,
  brandingStandingLine,
  brandingWords,
  letterheadRefusalWords,
} from './copy/branding';
export * from './copy/breadcrumb';
export * from './copy/card';
export type { AddItemCaller, AddItemFacts, CatalogAddItemWords } from './copy/catalog-add-item';
export { catalogAddItemWords, catalogItemAddedToast } from './copy/catalog-add-item';
export type { AddItemFieldWords } from './copy/catalog-add-item-fields';
export { catalogItemFailuresOf, catalogItemFailureWords } from './copy/catalog-add-item-fields';
export { catalogAttributionRowOf, catalogAttributionWords } from './copy/catalog-attribution';
export { CATALOG_EDITOR, releaseChangeWord } from './copy/catalog-editor';
export { catalogImportFields } from './copy/catalog-import-fields';
export { catalogImportNotes } from './copy/catalog-import-notes';
export type { ImportRowSubKind, ImportRowWordsFacts } from './copy/catalog-import-rows';
export { catalogImportRowWords, catalogImportWords } from './copy/catalog-import-rows';
export * from './copy/catalog-settings';
export * from './copy/catalog-views';
export type { CatalogListFacts, CatalogRowFacts } from './copy/catalog-words';
export {
  catalogEditorChips,
  catalogItemsWords,
  catalogPriceEditorWords,
  catalogReleaseStripWords,
  catalogReleaseWords,
  catalogRowWords,
} from './copy/catalog-words';
export * from './copy/charts';
export * from './copy/checklist';
export * from './copy/chip-group';
export * from './copy/coach-mark';
export type { CompanyLogoWordFacts, CompanyLogoWords } from './copy/company-logo';
export { COMPANY_LOGO, companyLogoWords } from './copy/company-logo';
export {
  COMPANY_PROFILE,
  COMPANY_PROFILE_PART_TITLE,
  COMPANY_PROFILE_STANDING_WORD,
} from './copy/company-profile';
export type { CompanyProfileStepFacts } from './copy/company-profile-step-words';
export { companyProfileStepWords } from './copy/company-profile-step-words';
export type {
  CompanyProfileOption,
  CompanyProfilePartWords,
  CompanyProfileWordFacts,
  CompanyProfileWords,
} from './copy/company-profile-words';
export { companyProfileWords } from './copy/company-profile-words';
export type {
  CompanySignupCopyKey,
  SignupExplainers,
  SignupStepsWords,
} from './copy/company-signup';
export {
  COMPANY_SIGNUP,
  companyFieldRefusal,
  signupExplainers,
  signupStepsWords,
} from './copy/company-signup';
export type { CompanyFieldWords } from './copy/company-signup-frames';
export { companyFacts, companyFieldWords } from './copy/company-signup-frames';
export { knownNumberWords, requestSentWords } from './copy/company-signup-off-flow';
export { companyStepWords } from './copy/company-signup-step';
export * from './copy/compare-grid';
export * from './copy/compliance-floor';
export { CONNECTION, connectionWords } from './copy/connection';
export { AGENT_CALL_CORRELATION, agentCallCorrelation } from './copy/correlation';
export * from './copy/data-table';
export * from './copy/date-picker';
export * from './copy/date-set';
export * from './copy/derivation';
export * from './copy/detail-panel';
export { disclosureLead, disclosureLine } from './copy/disclosure';
export { BASIS_LINE_WORD } from './copy/document-basis';
export * from './copy/drawing-sheet';
export * from './copy/dropzone';
export { energySourceLabel } from './copy/energy-source';
export type { ExplainerWords } from './copy/explainer';
export { explainerPagerWords } from './copy/explainer';
export * from './copy/field-override';
export * from './copy/filter-bar';
export { FILTER_PANEL, filterPanelWords } from './copy/filter-panel';
export * from './copy/finding-list';
export type { FirstRunProfileFacts, FirstRunProfileWords } from './copy/first-run-profile';
export { FIRST_RUN_PROFILE, firstRunProfileWords } from './copy/first-run-profile';
export { freshnessLabel } from './copy/freshness';
export { homeTitle } from './copy/homes';
export * from './copy/image';
export type {
  InviteRoleWords,
  InviteWords,
  SetupInviteWords,
} from './copy/invite';
export { inviteFieldWords, inviteWords, setupInviteWords } from './copy/invite';
export { inviteDeclinedNotice, reinviteRequestedNotice } from './copy/invite-answer';
export type { InviteDeclineWords } from './copy/invite-decline';
export { INVITE_DECLINE } from './copy/invite-decline';
export type { InviteLandingFacts, InviteLandingWords } from './copy/invite-landing';
export { INVITE_LANDING, inviteLandingWords } from './copy/invite-landing';
export * from './copy/invoice-document';
export * from './copy/job-tray';
export type { JoinRequestAsker } from './copy/join-request';
export { joinRequestNotice } from './copy/join-request';
export * from './copy/kanban';
export { languageSwitcherWords } from './copy/language-switcher';
export * from './copy/map-surface';
export * from './copy/menu';
export * from './copy/money-summary';
export type { NameAndPhotoEditorWords } from './copy/name-and-photo-editor';
export { NAME_AND_PHOTO_EDITOR, nameAndPhotoEditorWords } from './copy/name-and-photo-editor';
export { centreActToast, centreFilterWords, centreHeadWords } from './copy/notification-head';
export { type CentreClock, centreListWords } from './copy/notification-list';
export * from './copy/notifications';
export * from './copy/number-field';
export * from './copy/operation-progress';
export * from './copy/option-card-group';
export * from './copy/otp-input';
export * from './copy/paged-document';
export type { PaymentTermsWords } from './copy/payment-terms';
export {
  paymentTermsEditorSaid,
  paymentTermsFailureWords,
  paymentTermsSavedLine,
  paymentTermsWords,
} from './copy/payment-terms';
export * from './copy/pending-action';
export * from './copy/phone-field';
export * from './copy/price-book';
export type {
  ProfilePreferencesWordFacts,
  ProfilePreferencesWords,
  ProfileRoleWords,
} from './copy/profile-preferences';
export { PROFILE_PREFERENCES, profilePreferencesWords } from './copy/profile-preferences';
export { stageWords } from './copy/project-stages';
export type { ProposalTemplateWords } from './copy/proposal-template';
export {
  languageName,
  proposalTemplatePageWords,
  proposalTemplateWords,
  sectionWords,
  templateLanguages,
} from './copy/proposal-template';
export {
  phaseEditorWords,
  templateFieldRefusals,
  templateRefusalWords,
} from './copy/proposal-template-phase';
export { provenanceWords, standingLabel, tierLabel } from './copy/provenance';
export * from './copy/qr-code';
export * from './copy/range-field';
export type { RemoveRolesWords, RolesRemovedToast } from './copy/remove-roles';
export { removeRolesWords, rolesRemovedToast, rolesUndoFailedToast } from './copy/remove-roles';
export * from './copy/reorder-list';
export { richTextWords } from './copy/rich-text';
export type { RoleCardLineWords, RoleCardWords } from './copy/role-card';
export { ROLE_CARD, roleCardWords } from './copy/role-card';
export { REFERENCE_ROW, REFERENCE_SCOPE } from './copy/role-matrix';
export type {
  ReferenceLineWords,
  RoleReferenceWords,
  RolesReferenceWords,
  UncountedHolderWords,
} from './copy/roles-reference';
export { ROLES_REFERENCE, rolesReferenceWords } from './copy/roles-reference';
export * from './copy/scope-note';
export * from './copy/search-field';
export * from './copy/select';
export type { SettingsWords } from './copy/settings';
export {
  backToSettings,
  settingsListFor,
  settingsRowName,
  settingsSavedLine,
  settingsWords,
} from './copy/settings';
export type { SetupLanguageOption, SetupLanguageWords } from './copy/setup-language';
export { SETUP_LANGUAGE, setupLanguageWords } from './copy/setup-language';
export type { SetupReadyDoorWords, SetupReadyWords } from './copy/setup-ready';
export { SETUP_READY, setupReadyWords } from './copy/setup-ready';
export type {
  SetupWhatYouSellFacts,
  SetupWhatYouSellOption,
  SetupWhatYouSellWords,
} from './copy/setup-what-you-sell';
export { SETUP_WHAT_YOU_SELL, setupWhatYouSellWords } from './copy/setup-what-you-sell';
export * from './copy/sheet';
export {
  accessRemovedWords,
  accountMenuWords,
  destinationLabel,
  doorTitle,
  firstRunMarkLabels,
  firstRunMarkWords,
  homeBlocksWords,
  homeHeadWords,
  presetLine,
  presetName,
  SHELL,
  todayLine,
  updateOnStoreLabel,
  verbLabel,
} from './copy/shell';
export type { SignInCopyKey } from './copy/sign-in';
export { SIGN_IN } from './copy/sign-in';
export type { SignInFacts, SignInLabels, SignInWords } from './copy/sign-in-frames';
export { signInWords } from './copy/sign-in-frames';
export type { DoorBlockWords, GoogleLinkWords, PhoneGoogleWords } from './copy/sign-in-google';
export { googleLinkWords, phoneGoogleWords } from './copy/sign-in-google';
export type {
  DoorSwitchFacts,
  DoorSwitchWords,
  NumberStepFacts,
  NumberStepWords,
} from './copy/sign-in-number';
export { doorNoticeWords, doorSwitchWords, numberStepWords } from './copy/sign-in-number';
export * from './copy/slider';
export * from './copy/source-document';
export * from './copy/stat-card';
export * from './copy/stepper';
export { STRUCTURE_DISCLAIMER } from './copy/structure-disclaimer';
export type { TeamClock, TeamRowWords } from './copy/team';
export { TEAM, TEAM_EMPTY_CHIP, teamRowWords, teamStatusWord } from './copy/team';
export type {
  TeamActToast,
  TeamActWords,
  TeamAskWords,
  TeamConfirmShown,
} from './copy/team-acts';
export { teamActWords } from './copy/team-acts';
export type { TeamListWords } from './copy/team-list';
export { teamListWords } from './copy/team-list';
export * from './copy/time-field';
export * from './copy/timeline';
export * from './copy/toast-host';
export * from './copy/transcript';
export * from './copy/usage-meter';
export type { ValidationIssueLike } from './copy/validation';
export { createFormsValidationMessage } from './copy/validation';
export * from './copy/version-diff';
export type { LanguageMeta } from './languages';
export { LANGUAGE_META, loadCatalog } from './languages';
export type { I18nRuntime, MessageRef, Translator } from './runtime';
export { createI18nRuntime, createTranslator, packWords } from './runtime';
