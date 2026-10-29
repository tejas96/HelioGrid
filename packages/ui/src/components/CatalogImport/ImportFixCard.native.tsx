import { COMPONENT_KINDS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { NumberField } from '../NumberField/NumberField.native';
import { Select } from '../Select/Select.native';
import type { ImportCardView } from './CatalogImport.logic';
import { CARD_RADIUS, raisedCard } from './CatalogImport.surfaces.native';
import type { CatalogImportWords } from './CatalogImport.types';
import { pickAnswers } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph.native';
import { useFocusOnMount } from './use-focus-on-mount.native';

/**
 * One row that needs the person (m17-c): the row and what it matched, what is wrong asked as a
 * question, its fix in place, and *Leave out* last — a red raised pill. The act is domain's.
 */
export function ImportFixCard({
  card,
  words,
  focus = false,
}: {
  card: ImportCardView;
  words: CatalogImportWords;
  /** The card returns from an *Undo*: it takes the screen reader's focus the *Undo* had. */
  focus?: boolean;
}) {
  const target = useFocusOnMount(focus);
  return (
    <View ref={target} style={styles.card}>
      <View style={styles.words}>
        {/* The row's product is the file's own text: one line, cut short. */}
        <Text variant="body-sm" bold oneLine>
          {card.title}
        </Text>
        <Text variant="caption" color="secondary">
          {card.sub}
        </Text>
      </View>
      <Text variant="caption" color="warning">
        {card.question}
      </Text>
      <FixAct card={card} words={words} />
    </View>
  );
}

function FixAct({ card, words }: { card: ImportCardView; words: CatalogImportWords }) {
  const leaveOut = (
    <Button
      variant="secondary"
      size="sm"
      tone="danger"
      icon={<ShellGlyph name="minus-circle" size="sm" tone="danger" />}
      disabled={card.busy}
      onClick={() => card.choose({ act: 'leaveOut' })}
    >
      {words.leaveOut}
    </Button>
  );
  switch (card.act) {
    case 'price':
      return <PriceFix card={card} words={words} leaveOut={leaveOut} />;
    case 'answer':
      return (
        <View style={styles.acts}>
          <Button
            variant="secondary"
            size="sm"
            disabled={card.busy}
            onClick={() => card.choose({ act: 'answer', answer: 'keep_catalog_spec' })}
          >
            {words.keepSpec}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={card.busy}
            onClick={() => card.choose({ act: 'answer', answer: 'import_as_own_item' })}
          >
            {words.importAsOwn}
          </Button>
          {leaveOut}
        </View>
      );
    case 'pick':
    case 'kind':
      return <KindFix card={card} words={words} leaveOut={leaveOut} />;
    case 'repeat':
      return (
        <View style={styles.acts}>
          <Button
            variant="secondary"
            size="sm"
            disabled={card.busy}
            onClick={() => card.choose({ act: 'repeat' })}
          >
            {words.useThisPrice}
          </Button>
          {leaveOut}
        </View>
      );
    case 'none':
      return <View style={styles.acts}>{leaveOut}</View>;
  }
}

interface FixProps {
  card: ImportCardView;
  words: CatalogImportWords;
  leaveOut: ReactNode;
}

/** *Your price* and *Set price*: the field starts at the file's own figure where one reads. */
function PriceFix({ card, words, leaveOut }: FixProps) {
  const [price, setPrice] = useState<number | undefined>(undefined);
  return (
    <View style={styles.price}>
      <NumberField
        label={words.yourPrice}
        words={words.numberField}
        value={price}
        currency
        steppers={false}
        commits="as-typed"
        density="functional"
        disabled={card.busy}
        onCommit={setPrice}
        onClear={() => setPrice(undefined)}
      />
      <View style={styles.acts}>
        <Button
          variant="primary"
          size="sm"
          disabled={card.busy || price === undefined}
          onClick={() => {
            if (price !== undefined) card.choose({ act: 'price', price: String(price) });
          }}
        >
          {words.setPrice}
        </Button>
        {leaveOut}
      </View>
    </View>
  );
}

/**
 * *Which product is it?* over the candidates, or *Kind* over every kind. Two candidates of one
 * kind cannot be told apart by the answer, so that card offers *Leave out* only.
 */
function KindFix({ card, words, leaveOut }: FixProps) {
  if (card.act === 'pick' && !pickAnswers(card)) {
    return <View style={styles.acts}>{leaveOut}</View>;
  }
  const pick = card.act === 'pick';
  return (
    <View style={styles.choose}>
      <View style={styles.select}>
        <Select
          ariaLabel={pick ? words.whichProduct : words.kindLabel}
          placeholder={pick ? words.chooseProduct : words.chooseKind}
          closeLabel={words.closeList}
          options={[...card.options]}
          density="functional"
          disabled={card.busy}
          onChange={(value) => {
            const kind = COMPONENT_KINDS.find((known) => known === value);
            if (kind !== undefined) card.choose({ act: 'kind', kind });
          }}
        />
      </View>
      {leaveOut}
    </View>
  );
}

/** A row this visit settled: green, what was set, and *Undo*. */
export function ImportFixedCard({
  title,
  line,
  words,
  onUndo,
  focus,
}: {
  title: string;
  line: string;
  words: CatalogImportWords;
  onUndo: () => void;
  /** The card just settled: it takes the focus its fix had. */
  focus: boolean;
}) {
  const target = useFocusOnMount(focus);
  return (
    <View ref={target} style={styles.fixed}>
      <ImportGlyph name="tick" size="md" stroke={2.2} color={theme.colors['success-text']} />
      <View style={styles.fixedWords}>
        <Text variant="body-sm" bold oneLine>
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {line}
        </Text>
      </View>
      <View style={styles.undo}>
        <Button variant="ghost" size="sm" onClick={onUndo}>
          {words.undo}
        </Button>
      </View>
    </View>
  );
}

/* The board's 375 cards: radius 18, 14 around, 10 between; the amber edge 4 wide on the left; the
   acts 8 apart and wrapping. The fixed card is the success wash at 12 by 14 — `success-bg` is
   that wash, so no tint is mixed here. */
const styles = StyleSheet.create({
  card: {
    ...raisedCard,
    borderRadius: CARD_RADIUS,
    padding: 14,
    gap: 10,
    borderLeftWidth: theme.spacing['sp-1'],
    borderLeftColor: theme.colors.warning,
  },
  words: { gap: theme.spacing['sp-0-5'], minWidth: 0 },
  acts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  price: { gap: theme.spacing['sp-2'], minWidth: 0 },
  choose: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  select: { flex: 1, minWidth: 0 },
  fixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: 14,
    borderRadius: CARD_RADIUS,
    backgroundColor: theme.colors['success-bg'],
  },
  fixedWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  undo: { flexShrink: 0 },
});
