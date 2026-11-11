import { theme } from '@heliogrid/theme';
import { type Ref, type RefObject, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import {
  heroActOf,
  isPrimaryNext,
  isViewOnly,
  nextPlaceOf,
  packFileOf,
  proofRowOf,
  samePlace,
} from './ProjectDetail.logic';
import type { ProjectDetailProps } from './ProjectDetail.types';
import { nextGlyphOf } from './ProjectHero.glyph';

/** Where the hero hands the screen reader: its act's button, and its line for a hero with none. */
interface HeroRefs {
  readonly act: Ref<FocusHandle>;
  readonly line: RefObject<View | null>;
}

/**
 * The one hero on the phone: the stage and the day it entered, the days figure — never a %
 * (`M08-12`) — then the one next step and its act, drawn only where the reader may take it. A closed
 * project says how it closed instead, and a handed-over one offers its pack.
 */
export function ProjectHero(props: ProjectDetailProps) {
  const { project, view, words, heroFocus } = props;
  const act = useRef<FocusHandle>(null);
  const line = useRef<View>(null);
  // The screen reader lands on the hero's act, else on its line: whichever the hero draws now.
  useImperativeHandle(heroFocus, () => ({
    focus: () => {
      if (act.current !== null) act.current.focus();
      else focusScreenReaderOn(() => line.current);
    },
  }));
  const refs = { act, line };
  return (
    <HeroPanel label={words.now}>
      <View style={styles.now}>
        <View style={styles.stage}>
          <Text variant="figure">{words.stage(project.stage)}</Text>
          <Text variant="body-sm" color="secondary">
            {words.since(project.enteredOn)}
          </Text>
        </View>
        <View style={styles.days}>
          <Text variant="hero" oneLine>
            {String(view.days)}
          </Text>
          <Text variant="caption" color="secondary" align="end">
            {words.daysHere(view.days)}
          </Text>
        </View>
      </View>
      <View style={styles.rule} />
      {view.closed ? <ClosedLine {...props} refs={refs} /> : <NextBlock {...props} refs={refs} />}
    </HeroPanel>
  );
}

function NextBlock(props: ProjectDetailProps & { refs: HeroRefs }) {
  const { project, view, words, refs } = props;
  return (
    <>
      <View ref={refs.line} style={styles.next} accessible>
        <Text variant="overline" color="secondary">
          {words.next}
        </Text>
        <Text variant="body-lg" bold>
          {words.nextTitle(view.next, proofRowOf(project, view.next))}
        </Text>
        <Text variant="body-sm" color="secondary">
          {words.nextLine(view.next)}
        </Text>
      </View>
      {heroActOf(project, view) ? (
        <NextActs {...props} />
      ) : isViewOnly(project, view) ? (
        <View style={styles.viewOnly}>
          <ShellGlyph name="eye" size="sm" tone="secondary" />
          <Text variant="body-sm" color="secondary">
            {words.viewOnly}
          </Text>
        </View>
      ) : null}
    </>
  );
}

/** The hero's act — the next step's — and, when the install date has passed, who we wait on. */
function NextActs({
  project,
  view,
  words,
  onNext,
  onSteps,
  onWait,
  sending,
  uploading,
  refs,
}: ProjectDetailProps & { refs: HeroRefs }) {
  const { next } = view;
  const place = nextPlaceOf(next);
  const glyph = nextGlyphOf(next);
  const primary = isPrimaryNext(next);
  return (
    <View style={styles.acts}>
      <Button
        ref={refs.act}
        variant={primary ? 'primary' : 'secondary'}
        size="lg"
        fullWidth
        icon={
          glyph === null ? null : (
            <ShellGlyph name={glyph} size="md" tone={primary ? 'inverse' : 'primary'} />
          )
        }
        loading={place !== null && samePlace(uploading, place)}
        {...(place?.slotKey ? { spokenName: words.uploadRow(place.slotKey) } : {})}
        onClick={() => {
          if (sending) return;
          if (next.kind === 'steps') onSteps();
          else onNext(next);
        }}
      >
        {words.nextAct(next)}
      </Button>
      {next.kind === 'install_date_passed' && project.wait === null && project.acts.stages ? (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => {
            if (!sending) onWait();
          }}
        >
          {words.noWaitTitle}
        </Button>
      ) : null}
    </View>
  );
}

/** How a closed project closed: handed over on its day with its pack, or cancelled and why. */
function ClosedLine({ project, words, onOpenFile, refs }: ProjectDetailProps & { refs: HeroRefs }) {
  const pack = packFileOf(project);
  const cancelled = project.stage === 'cancelled';
  return (
    <>
      <View ref={refs.line} style={styles.next} accessible>
        <Text variant="body-sm" color="secondary">
          {cancelled
            ? words.cancelledLine(project.cancel?.reason ?? '')
            : words.handedOverOn(project.enteredOn)}
        </Text>
        {cancelled && project.cancel?.note ? (
          <Text variant="body-sm">{project.cancel.note}</Text>
        ) : null}
      </View>
      {cancelled || pack === null ? null : (
        <Button
          ref={refs.act}
          variant="secondary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="download" size="md" tone="primary" />}
          onClick={() => onOpenFile(pack)}
        >
          {words.handoverPack}
        </Button>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  now: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  stage: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  days: { flexShrink: 0, alignItems: 'flex-end', gap: theme.spacing['sp-1'] },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors['line-soft'] },
  next: { gap: theme.spacing['sp-1'] },
  acts: { gap: theme.spacing['sp-2'] },
  viewOnly: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
