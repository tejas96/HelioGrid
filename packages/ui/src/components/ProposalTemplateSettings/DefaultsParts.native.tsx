import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages.native';
import { ProposalPicture } from '../ProposalPicture/ProposalPicture.native';
import { StepHint, StepTile, stepLayout } from '../ProposalSteps/StepParts.native';
import { Switch } from '../Switch/Switch.native';
import { BrandSwatch } from './BrandSwatch.native';
import {
  DEFAULTS_PAGE_WIDTH,
  sampleWith,
  wallLine,
  wallPages,
} from './ProposalTemplateSettings.logic';
import type {
  DefaultsLookView,
  DefaultsPagesView,
  DefaultsSample,
  ProposalDefaultsWords,
} from './ProposalTemplateSettings.types';

function Chosen() {
  return (
    <View style={styles.check}>
      <ShellGlyph name="tick-small" size="sm" tone="inverse" />
    </View>
  );
}

/** A tile's name over its line; in a row (`grow`) it takes the room the row leaves it. */
function Words({ name, line, grow = false }: { name: string; line: string; grow?: boolean }) {
  return (
    <View style={[styles.words, grow ? styles.grow : undefined]}>
      <Text variant="body-sm" bold>
        {name}
      </Text>
      <Text variant="caption" color="secondary">
        {line}
      </Text>
    </View>
  );
}

/**
 * *Look* (`T-M01-030`): the cover picture every new proposal starts with — one of the platform's
 * four, or the company's own photo — and the brand, which is Branding's and only linked here.
 */
export function DefaultsLook({
  view,
  words,
}: {
  view: DefaultsLookView;
  words: ProposalDefaultsWords;
}) {
  const { own, brand } = view;
  const ownOn = view.chosen === 'own';
  return (
    <View style={stepLayout.column}>
      <View style={stepLayout.field}>
        <View style={stepLayout.top}>
          <Text variant="field-label" color="secondary">
            {words.coverPicture}
          </Text>
          <Text variant="caption" color="secondary">
            {words.coverPictureTag}
          </Text>
        </View>
        <View
          style={styles.covers}
          accessibilityRole="radiogroup"
          accessibilityLabel={words.coverPicture}
        >
          {view.covers.map((cover) => {
            const on = view.chosen === cover.key;
            return (
              <Pressable
                key={cover.key}
                style={styles.cover}
                accessibilityRole="radio"
                accessibilityLabel={cover.name}
                accessibilityState={{ checked: on }}
                onPress={() => view.onCover(cover.key)}
              >
                <StepTile style={on ? styles.tileOn : styles.tileOff}>
                  <ProposalPicture name={cover.key} style={styles.picture} />
                  <Words name={cover.name} line={cover.line} />
                  {on ? <Chosen /> : null}
                </StepTile>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={words.ownPhoto}
          accessibilityState={{ checked: ownOn, busy: own.storing }}
          disabled={own.storing}
          onPress={ownOn || own.onUse === undefined ? own.onChoose : own.onUse}
        >
          <StepTile style={ownOn ? styles.rowOn : styles.rowOff}>
            <View style={styles.ownPicture}>
              {own.src === undefined ? (
                <ShellGlyph name="upload" size="md" />
              ) : (
                <ProposalPicture src={own.src} style={styles.ownFill} />
              )}
            </View>
            <Words name={words.ownPhoto} line={words.ownPhotoLine} grow />
            {own.src !== undefined && ownOn ? <Chosen /> : null}
          </StepTile>
        </Pressable>
        {own.error === undefined ? null : (
          <View style={styles.refusal} accessibilityRole="alert">
            <ShellGlyph name="alert-circle" size="sm" tone="danger" />
            <Text variant="caption" color="danger">
              {own.error}
            </Text>
          </View>
        )}
      </View>
      <Pressable accessibilityLabel={brand.label} onPress={brand.onOpen}>
        <StepTile style={styles.brand}>
          <BrandSwatch brand={brand} />
          <View style={styles.words}>
            <Text variant="caption" color="secondary">
              {brand.label}
            </Text>
            <Text variant="body-sm" bold>
              {brand.value}
            </Text>
          </View>
          <ShellGlyph name="chevron-right" size="sm" />
        </StepTile>
      </Pressable>
      <StepHint>{words.lookHint}</StepHint>
    </View>
  );
}

/**
 * *Pages* (`T-M01-030`): one row per page with its thumbnail and a switch. The cover, the price
 * page and the terms carry a lock and *Always*, never a switch.
 */
export function DefaultsPages({
  view,
  sample,
  words,
}: {
  view: DefaultsPagesView;
  sample: DefaultsSample | null;
  words: ProposalDefaultsWords;
}) {
  return (
    <View style={stepLayout.column}>
      <StepTile>
        {view.rows.map((row, index) => {
          const name = words.pageName[row.page];
          return (
            <View
              key={row.page}
              style={[styles.pageRow, index > 0 ? styles.pageRowNext : undefined]}
            >
              <View
                style={[styles.thumb, row.on ? undefined : styles.quiet]}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                {sample === null ? null : (
                  <ScaledProposalPage
                    {...sampleWith(sample, row.page)}
                    page={row.page}
                    width={DEFAULTS_PAGE_WIDTH.row}
                    still
                  />
                )}
              </View>
              <Words name={name} line={words.pageWhat[row.page]} grow />
              {row.always ? (
                <View style={styles.lock}>
                  <ShellGlyph name="lock" size="sm" />
                  <Text variant="caption" color="secondary">
                    {words.always}
                  </Text>
                </View>
              ) : (
                <Switch
                  checked={row.on}
                  onChange={() => view.onToggle(row.page)}
                  ariaLabel={words.printPage(name)}
                />
              )}
            </View>
          );
        })}
      </StepTile>
      <StepHint>{words.pagesHint}</StepHint>
    </View>
  );
}

/** Every page at once: a page that is off stays on the wall, quiet, and says *Off*. */
export function DefaultsWall({
  sample,
  words,
  width,
}: {
  sample: DefaultsSample;
  words: ProposalDefaultsWords;
  width: number;
}) {
  return (
    <View style={styles.wall}>
      {wallPages(sample).map((wall) => (
        <View key={wall.page} style={styles.wallPage}>
          <View style={wall.on ? undefined : styles.quiet}>
            <ScaledProposalPage
              {...sampleWith(sample, wall.page)}
              page={wall.page}
              width={width}
              still
            />
          </View>
          <Text variant="caption" color="secondary">
            {wallLine(words, wall)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  covers: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-3'] },
  cover: { flexGrow: 1, flexBasis: '45%', minWidth: 0 },
  tileOn: { overflow: 'hidden', borderWidth: 2, borderColor: colors.accent },
  tileOff: { overflow: 'hidden' },
  // A picture's own box sizes to nothing: it is given its size, as the page parts give theirs.
  picture: { height: 88, alignSelf: 'stretch' },
  ownFill: { width: 64, height: 64 },
  words: { flexShrink: 1, minWidth: 0, gap: 2, padding: theme.spacing['sp-3'] },
  grow: { flexGrow: 1, flexBasis: 0 },
  check: {
    position: 'absolute',
    top: theme.spacing['sp-2'],
    right: theme.spacing['sp-2'],
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
  },
  rowOff: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 64,
    overflow: 'hidden',
  },
  rowOn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 64,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  ownPicture: {
    width: 64,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: theme.spacing['sp-4'],
    gap: theme.spacing['sp-1'],
  },
  refusal: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  pageRowNext: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  thumb: {
    borderRadius: theme.radius['r-xs'],
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors['line-soft'],
  },
  quiet: { opacity: 0.45 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  wall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing['sp-4'],
  },
  wallPage: { alignItems: 'center', gap: theme.spacing['sp-2'] },
});
