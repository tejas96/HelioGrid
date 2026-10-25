'use client';
import {
  type PhaseOpen,
  type ProposalTemplatePage,
  templateViewOf,
  useProposalTemplate,
  useSession,
} from '@heliogrid/data/react';
import { opensSettingsRow, SETTINGS_SEGMENT, type UiLanguage } from '@heliogrid/domain';
import {
  proposalTemplatePageWords,
  proposalTemplateWords,
  SHELL,
  sectionWords,
  templateFieldRefusals,
  templateLanguages,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  Banner,
  BannerAction,
  ProposalTemplateSettings,
  type TemplatePartName,
  Text,
  templateDocumentOf,
  templateSettingsParts,
  useFormat,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { settingsRowPath } from '../settings';
import { TemplateOverlays } from './components/TemplateOverlays';

/**
 * The Proposal template behind `More` on the web (`SCR-M01-19`, `M01-51`, `M01-52`): the PDF a
 * customer opens, and the cover, sections, terms and phases that make it. What is read, edited
 * and saved is `useProposalTemplate`'s; the page body is `ProposalTemplateSettings`. This holds
 * the web's own parts — the phase editor's panel, the full-size reader, the two confirms and the
 * leave guard. Only a person whose presets open the row reaches it (`F7-48`).
 */
export function ProposalTemplateScreen() {
  const { user } = useSession();
  if (!opensSettingsRow(user?.tenant?.roles ?? [], 'proposal_templates')) notFound();
  return <ProposalTemplateIn />;
}

function ProposalTemplateIn() {
  const { t } = useI18n();
  const page = useProposalTemplate();
  const words = proposalTemplateWords(t);
  if (page.status !== 'unread') return <TemplatePage page={page} />;
  return (
    <div className="hg-shell-page">
      <Text as="h1" variant="h2">
        {words.title}
      </Text>
      <Banner
        kind="validation"
        density="functional"
        title={words.unread}
        action={<BannerAction onClick={page.retryRead}>{words.tryAgain}</BannerAction>}
      />
    </div>
  );
}

function TemplatePage({ page }: { page: ProposalTemplatePage }) {
  const { t, locale } = useI18n();
  const { pack, date } = useFormat();
  const router = useRouter();
  const guarded = useGuardedMove();
  const [part, setPart] = useState<TemplatePartName>('cover');
  const [coverLanguage, setCoverLanguage] = useState<UiLanguage>('en');
  const [termsLanguage, setTermsLanguage] = useState<UiLanguage>('en');
  const [phaseOpen, setPhaseOpen] = useState<PhaseOpen | null>(null);
  const [deleteAsked, setDeleteAsked] = useState<{ key: number; title: string } | null>(null);
  const [fullSizeOpen, setFullSizeOpen] = useState(false);
  const [leaveAsked, setLeaveAsked] = useState<(() => void) | null>(null);
  const changed = page.changed.template || page.changed.timeline;
  useLeaveGuard(changed, (leave) => setLeaveAsked(() => leave));

  const words = proposalTemplateWords(t);
  const said = proposalTemplatePageWords(t, page, { date: (epochMs) => date(new Date(epochMs)) });
  const draft = page.draft;
  const languages = { cover: coverLanguage, terms: termsLanguage };
  const view = templateViewOf(draft, languages, locale);
  const sectionWord = sectionWords(t, draft?.phases.length ?? 0);
  const document = templateDocumentOf(
    view,
    {
      cover: page.cover,
      taxIdLabel: pack.taxIdLabel,
      colour: page.brandColour,
      docDate: date(new Date()),
    },
    sectionWord,
  );
  // A refused save opens the part whose field says why, so the reason is in view.
  const save = () => {
    if (page.refusedPart !== null) setPart(page.refusedPart);
    page.save();
  };
  const toRow = (row: 'branding' | 'company_profile') =>
    guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT[row])));

  return (
    <div className="hg-shell-page">
      <ProposalTemplateSettings
        words={words}
        loading={page.status === 'loading'}
        title={words.title}
        {...(said.standing === undefined ? {} : { standing: said.standing })}
        part={part}
        onPart={setPart}
        document={document}
        unsaved={page.changed.template}
        held={changed}
        teaching={page.teaching}
        onWriteOwn={(written) => page.edit({ kind: 'writeOwn', part: written })}
        {...templateSettingsParts(view, {
          languages: templateLanguages(),
          coverLanguage,
          termsLanguage,
          onCoverLanguage: setCoverLanguage,
          onTermsLanguage: setTermsLanguage,
          sectionWord,
          ...templateFieldRefusals(t, page.refusals),
          edit: page.edit,
          onEditPhase: (key, phase) => setPhaseOpen({ key, phase }),
          onDeletePhase: (key, title) => setDeleteAsked({ key, title }),
          onAddPhase: () => setPhaseOpen({ key: null }),
        })}
        bankLine={words.bankFrom(page.bankName)}
        onOpenBranding={() => toRow('branding')}
        onOpenProfile={() => toRow('company_profile')}
        onOpenFullSize={() => setFullSizeOpen(true)}
        saveFailed={page.status === 'save-failed'}
        {...(changed
          ? { act: { saving: page.saving, onSave: save, onDiscard: page.discard } }
          : {})}
      />
      <TemplateOverlays
        page={page}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        state={{
          phaseOpen,
          deleteAsked,
          fullSizeOpen,
          closePhase: () => setPhaseOpen(null),
          closeDelete: () => setDeleteAsked(null),
          closeFullSize: () => setFullSizeOpen(false),
        }}
        leave={{
          asking: leaveAsked !== null,
          stay: () => setLeaveAsked(null),
          discardAndLeave: () => {
            setLeaveAsked(null);
            page.discard();
            leaveAsked?.();
          },
        }}
      />
    </div>
  );
}
