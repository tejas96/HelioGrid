'use client';
import {
  type ProposalTemplateScreen as ProposalTemplate,
  useProposalTemplateScreen,
} from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
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
  Text,
  templateDocumentOf,
  templateSettingsParts,
  useFormat,
} from '@heliogrid/ui';
import { notFound, useRouter } from 'next/navigation';
import { type RefObject, useRef } from 'react';
import { useGuardedMove, useLeaveGuard } from '../../lib/leave-guard';
import { settingsRowPath } from '../settings';
import { TemplateOverlays } from './components/TemplateOverlays';

/**
 * The Proposal template behind `More` on the web (`SCR-M01-19`, `M01-51`, `M01-52`): the PDF a
 * customer opens, and the cover, sections, terms and phases that make it. What it draws is
 * `useProposalTemplateScreen`'s, the phone's too; the page body is `ProposalTemplateSettings`. The
 * web's own parts are the phase editor's panel, the full-size reader, the two confirms and the
 * leave guard. Only a person whose presets open the row reaches it (`F7-48`).
 */
export function ProposalTemplateScreen() {
  const { t, locale } = useI18n();
  const screen = useProposalTemplateScreen(locale);
  /* One page element through a failed read and the page that follows it: *Try again* leaves with
     the failure, and the focus goes here. */
  const frame = useRef<HTMLDivElement>(null);
  if (!screen.allowed) notFound();
  const { page } = screen;
  const words = proposalTemplateWords(t);
  if (page.read.kind !== 'failed') return <TemplatePage screen={screen} frame={frame} />;
  return (
    <div ref={frame} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <Text as="h1" variant="h2">
        {words.title}
      </Text>
      <Banner
        kind="validation"
        density="functional"
        title={words.unread}
        action={
          <BannerAction onClick={page.read.retry} focusAfter={frame}>
            {words.tryAgain}
          </BannerAction>
        }
      />
    </div>
  );
}

function TemplatePage({
  screen,
  frame,
}: {
  screen: ProposalTemplate;
  frame: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useI18n();
  const { pack, date } = useFormat();
  const router = useRouter();
  const guarded = useGuardedMove();
  const { page, view, overlays, held } = screen;
  useLeaveGuard(held, screen.leave.ask);

  const words = proposalTemplateWords(t);
  const said = proposalTemplatePageWords(t, page, { date: (epochMs) => date(new Date(epochMs)) });
  const sectionWord = sectionWords(t, page.draft?.phases.length ?? 0);
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
  const toRow = (row: 'branding' | 'company_profile') =>
    guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT[row])));

  return (
    <div ref={frame} tabIndex={-1} className="hg-shell-page hg-focus-target">
      <ProposalTemplateSettings
        words={words}
        read={page.read}
        title={words.title}
        {...(said.standing === undefined ? {} : { standing: said.standing })}
        part={screen.part}
        onPart={screen.choosePart}
        document={document}
        unsaved={page.changed.template}
        held={held}
        teaching={page.teaching}
        onWriteOwn={(written) => page.edit({ kind: 'writeOwn', part: written })}
        {...templateSettingsParts(view, {
          languages: templateLanguages(),
          coverLanguage: screen.coverLanguage,
          termsLanguage: screen.termsLanguage,
          onCoverLanguage: screen.chooseCoverLanguage,
          onTermsLanguage: screen.chooseTermsLanguage,
          sectionWord,
          ...templateFieldRefusals(t, page.refusals),
          edit: page.edit,
          onEditPhase: overlays.editPhase,
          onDeletePhase: overlays.askDeletePhase,
          onAddPhase: overlays.addPhase,
        })}
        bankLine={words.bankFrom(page.bankName)}
        onOpenBranding={() => toRow('branding')}
        onOpenProfile={() => toRow('company_profile')}
        onOpenFullSize={overlays.openFullSize}
        saveFailed={page.saveFailure !== null}
        {...(held
          ? { act: { saving: page.saving, onSave: screen.save, onDiscard: page.discard } }
          : {})}
      />
      <TemplateOverlays
        page={page}
        words={words}
        closeLabel={t(SHELL.close)}
        document={document}
        overlays={overlays}
        leave={screen.leave}
      />
    </div>
  );
}
