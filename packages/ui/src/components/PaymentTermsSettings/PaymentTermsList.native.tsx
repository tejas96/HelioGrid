import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { AllocationMeter } from '../AllocationMeter/AllocationMeter.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { Card } from '../Card/Card.native';
import { Badge } from '../Chip/Chip.native';
import { IconButton } from '../IconButton/IconButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import type { PaymentTermsCardView, PaymentTermsListProps } from './PaymentTermsSettings.types';

/**
 * The Payment terms page in the phone's one column (`SCR-M01-20` m20-a), inside the shell's
 * scrolling page: the saved line under the bar's title, the head, a card per template that shows
 * its split, and the closing line. The archived view swaps in the archived cards (m20-n8).
 */
export function PaymentTermsList(props: PaymentTermsListProps) {
  const { title, state } = props;
  return (
    <View style={styles.page}>
      <View style={[styles.head, title === undefined ? styles.underBarTitle : styles.titled]}>
        {title === undefined ? null : <Text variant="h2">{title}</Text>}
        {state === 'ready' && props.savedLine !== undefined ? (
          <Text variant="caption" color="secondary">
            {props.savedLine}
          </Text>
        ) : null}
      </View>
      <ListBody {...props} />
      {props.aside}
    </View>
  );
}

function ListBody(props: PaymentTermsListProps) {
  const { words } = props;
  if (props.state === 'loading') {
    return <LoadingBars label={words.loading} bars={['panel', 'panel', 'panel']} />;
  }
  if (props.state === 'unread') {
    return (
      <Banner kind="validation" density="functional" title={words.unreadTitle}>
        {words.unreadBody}
      </Banner>
    );
  }
  return (
    <>
      {props.teaching && !props.archived ? (
        <Banner kind="preliminary" density="functional" title={words.seededTitle}>
          {words.seededBody}
        </Banner>
      ) : null}
      <View style={styles.terms}>
        <View style={styles.termsHead}>
          <View style={styles.grow}>
            <Text variant="body-sm" bold>
              {props.archived ? words.archivedTitle : words.yourTerms}
            </Text>
          </View>
          <View style={styles.termsActs}>
            <Button
              variant={props.archived ? 'secondary' : 'ghost'}
              size="sm"
              icon={<ShellGlyph name="archive" size="sm" />}
              expanded={props.archived}
              spokenName={words.archivedCount(props.archivedCount)}
              onClick={props.onToggleArchived}
            >
              {String(props.archivedCount)}
            </Button>
            {props.archived ? null : (
              <IconButton label={words.addTerms} size={36} variant="surface" onClick={props.onAdd}>
                <ShellGlyph name="plus" size="sm" />
              </IconButton>
            )}
          </View>
        </View>
        {props.archived ? (
          <Text variant="caption" color="secondary">
            {props.cards.length === 0 ? words.nothingArchived : words.archivedCaption}
          </Text>
        ) : null}
        <View style={styles.cards}>
          {props.cards.map((card) => (
            <TermsCard key={card.id} card={card} {...props} />
          ))}
        </View>
      </View>
      {props.archived ? null : (
        <Text variant="caption" color="secondary" align="center">
          {words.closing}
        </Text>
      )}
    </>
  );
}

function TermsCard({
  card,
  words,
  archived,
  onOpen,
  onRestore,
}: PaymentTermsListProps & { card: PaymentTermsCardView }) {
  const opens = !archived;
  return (
    <Card
      surface="raised"
      density="functional"
      interactive={opens}
      selected={card.selected}
      {...(opens ? { label: card.label, onClick: () => onOpen(card.id) } : {})}
    >
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardName}>
            <View style={styles.grow}>
              <Text variant="body-sm" bold>
                {card.name}
              </Text>
            </View>
            {opens ? (
              <ShellGlyph name="chevron-right" size="md" tone="secondary" />
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<ShellGlyph name="undo" size="sm" />}
                spokenName={words.restoreName(card.name)}
                onClick={() => onRestore(card.id)}
              >
                {words.restore}
              </Button>
            )}
          </View>
          {card.isDefault || card.platformStandard ? (
            <View style={styles.marks}>
              {card.isDefault ? (
                <Badge tone="accent" density="functional">
                  {words.defaultMark}
                </Badge>
              ) : null}
              {card.platformStandard ? (
                <Badge tone="neutral" density="functional">
                  {words.platformStandard}
                </Badge>
              ) : null}
            </View>
          ) : null}
        </View>
        <AllocationMeter
          variant="split"
          density="functional"
          label={words.split(card.name)}
          parts={card.parts.map((part) => ({
            label: part.label,
            value: part.share,
            caption: part.stage,
          }))}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  /** The page's parts, `sp-4` apart; the shell pads the sides and scrolls it. */
  page: { gap: theme.spacing['sp-4'] },
  head: { gap: theme.spacing['sp-0-5'] },
  titled: { gap: theme.spacing['sp-1'] },
  /** Under the bar's title: past the back control and its gap (`sp-10` + `sp-4`). */
  underBarTitle: { marginLeft: theme.spacing['sp-10'] + theme.spacing['sp-4'] },
  grow: { flex: 1, minWidth: 0 },
  terms: { gap: theme.spacing['sp-3'] },
  termsHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  termsActs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    flexShrink: 0,
  },
  cards: { gap: theme.layout['tile-gap'] },
  card: { gap: theme.spacing['sp-3'] },
  cardTop: { gap: theme.spacing['sp-1'] },
  cardName: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  marks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-1'] },
});
