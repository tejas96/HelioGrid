import type { CustomerLink, CustomerLinks } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { failedReadOf } from '../ProposalAfterParts/ProposalAfterParts.logic';
import { AfterHint } from '../ProposalAfterParts/ProposalAfterParts.native';
import { StatusChip } from '../StatusChip/StatusChip.native';
import { linkActsOf, revokeConfirmOf } from './ProposalLinks.logic';
import type { ProposalLinksProps } from './ProposalLinks.types';

// web-only part: ProposalBlocks — the web takes only riseOrder for its CSS stagger; the phone uses Rising.

function LinkCard(props: ProposalLinksProps & { link: CustomerLink; mayRevoke: boolean }) {
  const { link, words, failure } = props;
  const live = link.status === 'active';
  return (
    <View style={[styles.card, live ? tileSurface : styles.off]}>
      {/* A tile's controls take the tile's fill, so the acts' discs show on the white card. */}
      <GroundProvider ground={live ? 'tile' : 'page'}>
        <View style={styles.head}>
          <View style={live ? undefined : styles.dim}>
            <Avatar name={link.contact?.name ?? link.label} size={40} />
          </View>
          <View style={styles.grow}>
            <View style={styles.top}>
              <Text variant="body-lg" bold>
                {link.label}
              </Text>
              <StatusChip
                status={link.status}
                label={words.status(link)}
                tone={live ? 'success' : 'neutral'}
                density="functional"
                glyph={
                  <ShellGlyph
                    name={live ? 'link' : 'link-off'}
                    size="sm"
                    tone={live ? 'success' : 'secondary'}
                  />
                }
              />
            </View>
            <Text variant="body-sm" color="secondary">
              {words.who(link)}
            </Text>
            <Text variant="body-sm" color="secondary">
              {words.line(link)}
            </Text>
            {failure?.linkId === link.id ? (
              <Text variant="body-sm" color="danger" live>
                {failure.reason}
              </Text>
            ) : null}
          </View>
        </View>
        {live ? (
          <View style={styles.acts}>
            {linkActsOf(props, link, props.mayRevoke).map((act) => (
              <IconButton key={act.key} {...act.button}>
                <ShellGlyph name={act.glyph} size="sm" tone="primary" />
              </IconButton>
            ))}
          </View>
        ) : null}
      </GroundProvider>
    </View>
  );
}

/** Turn off takes the link's acts away: focus then lands on the page's `focusAfter`. */
function ConfirmYes(
  props: ProposalLinksProps & { yes: ReturnType<typeof revokeConfirmOf>['yes'] },
) {
  const leaving = useFocusAfter(props.focusAfter);
  return (
    <Button {...props.yes} onClick={leaving(props.yes.onClick)}>
      {props.words.confirmYes}
    </Button>
  );
}

function Confirm(props: ProposalLinksProps & { links: CustomerLinks['links'] }) {
  const confirm = revokeConfirmOf(props, props.links);
  return (
    <EditorSurface {...confirm.sheet} showClose desktop="modal">
      {confirm.link === undefined ? null : (
        <View style={styles.confirm}>
          <Text variant="body" color="secondary">
            {props.words.confirmLine}
          </Text>
          <ConfirmYes {...props} yes={confirm.yes} />
          <Button {...confirm.no}>{props.words.confirmNo}</Button>
        </View>
      )}
    </EditorSurface>
  );
}

/** The deal's named links, on the phone (`SCR-M06-20`). */
export function ProposalLinks(props: ProposalLinksProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const { links, acts } = read.value;
  return (
    <View style={styles.links}>
      {links.length === 0 ? (
        <EmptyState scene="settle" title={words.noneTitle} description={words.noneLine} />
      ) : (
        links.map((link, index) => (
          <Rising key={link.id} order={index}>
            <LinkCard {...props} link={link} mayRevoke={acts.revoke} />
          </Rising>
        ))
      )}
      <AfterHint glyph="eye-off">{words.hint}</AfterHint>
      <Confirm {...props} links={links} />
    </View>
  );
}

const styles = StyleSheet.create({
  links: { gap: theme.spacing['sp-3'] },
  grow: { flex: 1, minWidth: 0 },
  card: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-lg'],
  },
  off: { borderWidth: 1, borderColor: colors['line-soft'] },
  dim: { opacity: 0.5 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-3'] },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing['sp-2'] },
  acts: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing['sp-2'] },
  confirm: { gap: theme.spacing['sp-4'] },
});
