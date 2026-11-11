'use client';
import { useHomeToday, useShell } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import {
  BLOCK,
  homeBlocksWords,
  homeGlanceWords,
  homeGreeting,
  homeHeadWords,
  readinessStepWords,
  readinessWords,
  todayLine,
  verbLabel,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  Button,
  GlanceStrip,
  HomeBlocks,
  HomeHead,
  homeGlanceFacts,
  ProposalReadiness,
  readinessSteps,
  ShellGlyph,
  Text,
  useFormat,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { FirstRunMark } from './components/FirstRunMark';
import { InstallerHome } from './components/InstallerHome';
import { DOOR_PATH, settingsRowPath } from './constants';

/**
 * The person's home inside the web shell (`M13-10`, `M01-17`, redesign direction A): the greeting
 * for the hour over the home's switcher, the role's verb as THE action, the first-proposal hero
 * with the next step, the day at a glance, then one block per held preset. The page's one heading
 * names the home; the greeting is its welcome. Every fact is `useShell()`'s and `useHomeToday()`'s,
 * the phone's too; this composes.
 */
export function HomeScreen() {
  const t = useTranslate();
  const format = useFormat();
  const shell = useShell();
  const today = useHomeToday();
  const router = useRouter();
  const page = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLSpanElement>(null);

  const home = shell.home;
  if (home === null) return null;
  const head = homeHeadWords(t, home.home, shell.homes);
  const verb = shell.centreVerb;
  const openRow = (row: SettingsRow) => router.push(settingsRowPath(SETTINGS_SEGMENT[row]));
  const readiness = today.readiness;
  const ready = readiness?.kind === 'ready' ? readiness.value : null;
  const steps =
    ready === null
      ? []
      : readinessSteps(ready.steps, (step) => readinessStepWords(t, step), openRow);
  const facts = homeGlanceFacts(today.glance, homeGlanceWords(t), format, openRow);
  return (
    <div className="hg-shell-page hg-home" ref={page}>
      {/* The page's heading for a screen reader: the home it names is the switcher's title. */}
      <Text as="h1" spokenOnly>
        {head.title}
      </Text>
      <HomeHead
        {...head}
        dateLine={todayLine(t, format.date(new Date()))}
        greeting={homeGreeting(t, today.dayPart, today.personName)}
        entries={head.entries.map((entry) => ({
          ...entry,
          key: entry.preset,
          onSelect: () => shell.chooseHome(entry.preset),
        }))}
        // The drawing's 284: half the form column and a gap, wide enough for a title and its preset.
        switcherWidth={theme.layout['form-max'] / 2 + theme.spacing['sp-6']}
        titleAnchor={titleRef}
        action={
          verb === null ? undefined : (
            <span ref={actionRef} className="hg-home-verb">
              <Button
                size="prominent"
                fullWidth
                icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
                onClick={() => router.push(DOOR_PATH[verb])}
              >
                {verbLabel(t, verb)}
              </Button>
            </span>
          )
        }
      />
      <div className="hg-home-grid">
        {readiness === null ? null : (
          <div className="hg-home-main">
            <ProposalReadiness
              words={readinessWords(t, ready ?? { done: 0, total: 0, complete: false })}
              done={ready?.done ?? 0}
              total={ready?.total ?? 0}
              steps={steps}
              next={steps.find((step) => step.key === ready?.next) ?? null}
              loading={readiness.kind !== 'ready'}
            />
          </div>
        )}
        <InstallerHome />
        <div className="hg-home-side">
          {facts.length < 2 ? null : <GlanceStrip facts={facts} name={homeGlanceWords(t).name} />}
          <HomeBlocks
            {...homeBlocksWords(t, home)}
            read={shell.read}
            loadingLabel={t(BLOCK.loading)}
          />
        </div>
      </div>
      <FirstRunMark
        shell={shell}
        within={page}
        anchors={{ switchHome: titleRef, action: actionRef }}
      />
    </div>
  );
}
