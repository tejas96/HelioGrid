import type { ProposalVersionSummary } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { HueTile } from '../HueTile/HueTile.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { failedReadOf } from '../ProposalAfterParts/ProposalAfterParts.logic';
import { AfterHint, AfterRow, AfterRows } from '../ProposalAfterParts/ProposalAfterParts.native';
import { versionActOf, versionFactGlyph } from './ProposalVersions.logic';
import type { ProposalVersionsProps, ProposalVersionsView } from './ProposalVersions.types';

// web-only part: ProposalBlocks — the web takes only riseOrder for its CSS stagger; the phone uses Rising.

type Ready = ProposalVersionsProps & { readonly view: ProposalVersionsView };

function Changed({ view, words, won }: Ready) {
  const { latest } = view;
  if (latest === null) return null;
  const changes = latest.diff?.changes ?? [];
  return (
    <HeroPanel label={words.changedTitle(latest.version)}>
      {latest.changeNote === null ? null : (
        <Text variant="display" style={styles.why}>
          {words.note(latest.changeNote)}
        </Text>
      )}
      <Text variant="body-sm" color="secondary">
        {words.whoLine(latest, won)}
      </Text>
      <View style={styles.changes}>
        {changes.map((change, index) => {
          const text = words.change(change);
          return (
            <Rising key={change.fact} order={index}>
              <View style={[styles.change, index > 0 ? styles.ruled : undefined]}>
                <HueTile glyph={versionFactGlyph(change.fact)} hue="ocean" size={36} />
                <View style={styles.grow}>
                  <Text variant="body" style={styles.name}>
                    {text.name}
                  </Text>
                  <View style={styles.pair}>
                    {/* As the design's phone: the old value under the name, the new at the row's end. */}
                    <Text variant="mono" color="secondary" style={[styles.from, styles.grow]}>
                      {text.from}
                    </Text>
                    <Text variant="mono" bold>
                      {text.to}
                    </Text>
                  </View>
                </View>
              </View>
            </Rising>
          );
        })}
      </View>
      {latest.diff === null ? null : (
        <View style={styles.same}>
          <ShellGlyph name="check" size="sm" tone="secondary" />
          <Text variant="body-sm" color="secondary">
            {words.unchanged(latest.diff.pagesUnchanged)}
          </Text>
        </View>
      )}
    </HeroPanel>
  );
}

function VersionRow(props: Ready & { version: ProposalVersionSummary; newest: boolean }) {
  const { version, newest, words } = props;
  const act = versionActOf(props, version, newest);
  const aside = (
    <Button
      {...act.button}
      icon={act.sends ? <ShellGlyph name="send" size="md" tone="inverse" /> : undefined}
    >
      {act.label}
    </Button>
  );
  return (
    <AfterRow
      glyph="layers"
      title={words.versionTitle(version)}
      line={words.versionLine(version)}
      leading={
        <View style={[styles.mark, newest ? undefined : styles.markOld]}>
          <Text variant="mono" color={newest ? 'accent' : 'secondary'}>
            {words.mark(version.version)}
          </Text>
        </View>
      }
      aside={aside}
    />
  );
}

/** A proposal's versions, on the phone (`SCR-M06-16`). */
export function ProposalVersions(props: ProposalVersionsProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const ready: Ready = { ...props, view: read.value };
  const { versions } = read.value;
  return (
    <View style={styles.versions}>
      <Changed {...ready} />
      {versions.length === 0 ? (
        <Text variant="body" color="secondary">
          {words.none}
        </Text>
      ) : (
        <AfterRows>
          {versions.map((version, index) => (
            <VersionRow key={version.version} {...ready} version={version} newest={index === 0} />
          ))}
        </AfterRows>
      )}
      <AfterHint>{words.hint(props.won)}</AfterHint>
    </View>
  );
}

const MARK = 44;

const styles = StyleSheet.create({
  versions: { gap: theme.spacing['sp-5'] },
  grow: { flex: 1, minWidth: 0 },
  // The fact's name at medium weight, as the web's `.hg-versions-change-name`.
  name: { fontWeight: `${theme.type.weights.medium}` },
  why: {
    fontFamily: theme.type.families.display,
    fontWeight: '400',
    fontSize: theme.type.roles['card-title'].fontSize,
    lineHeight: 32,
  },
  changes: { marginTop: theme.spacing['sp-4'] },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-3'],
  },
  ruled: { borderTopWidth: 1, borderTopColor: colors.hairline },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
  },
  from: { textDecorationLine: 'line-through' },
  same: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    marginTop: theme.spacing['sp-3'],
  },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: theme.radius['r-sm'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['accent-subtle'],
  },
  markOld: { backgroundColor: colors.fill },
});
