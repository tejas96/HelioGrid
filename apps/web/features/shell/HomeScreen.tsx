'use client';
import { useShell } from '@heliogrid/data/react';
import { homeBlocksWords, homeHeadWords, todayLine, verbLabel } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import { Button, HomeBlocks, HomeHead, ShellGlyph, Text, useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { FirstRunMark } from './components/FirstRunMark';
import { DOOR_PATH } from './constants';

/**
 * The person's home inside the web shell (`M13-10`, `M01-17`): the head — today, the title that
 * switches homes, whose home this is and the role's verb as its button — then one block per held
 * preset, teaching until each module fills it. The page's one heading names the home; the
 * title is the switcher, never a heading, because its open list sits inside it.
 */
export function HomeScreen() {
  const t = useTranslate();
  const format = useFormat();
  const shell = useShell();
  const router = useRouter();
  const page = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLSpanElement>(null);

  const home = shell.home;
  if (home === null) return null;
  const head = homeHeadWords(t, home.home, shell.homes);
  const verb = shell.centreVerb;
  return (
    <div className="hg-shell-page" ref={page}>
      <Text as="h1" className="hg-shell-heading">
        {head.title}
      </Text>
      <HomeHead
        {...head}
        dateLine={todayLine(t, format.date(new Date()))}
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
            <span ref={actionRef}>
              <Button
                icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
                onClick={() => router.push(DOOR_PATH[verb])}
              >
                {verbLabel(t, verb)}
              </Button>
            </span>
          )
        }
      />
      <HomeBlocks {...homeBlocksWords(t, home)} load={shell.load} onRetry={shell.retry} />
      <FirstRunMark
        shell={shell}
        within={page}
        anchors={{ switchHome: titleRef, action: actionRef }}
      />
    </div>
  );
}
