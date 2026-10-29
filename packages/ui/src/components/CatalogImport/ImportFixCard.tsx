import { COMPONENT_KINDS } from '@heliogrid/domain';
import { type ReactNode, useState } from 'react';
import { Text } from '../../primitives/Text/Text';
import { Button } from '../Button';
import { NumberField } from '../NumberField';
import { Select } from '../Select';
import type { ImportCardView } from './CatalogImport.logic';
import type { CatalogImportWords } from './CatalogImport.types';
import { pickAnswers } from './CatalogImport.view';
import { ImportGlyph } from './ImportGlyph';
import './ImportFixCard.css';
import { useFocusOnMount } from './use-focus-on-mount';

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
  /** The card returns from an *Undo*: it takes the focus the *Undo* had. */
  focus?: boolean;
}) {
  const target = useFocusOnMount<HTMLElement>(focus);
  return (
    <article ref={target} tabIndex={-1} className="hg-import-card" aria-busy={card.busy}>
      <div className="hg-import-card-words">
        <span className="hg-import-line" data-weight="bold">
          {card.title}
        </span>
        <span className="hg-import-line" data-tone="secondary">
          {card.sub}
        </span>
      </div>
      <Text variant="caption" color="warning" className="hg-import-question">
        {card.question}
      </Text>
      <FixAct card={card} words={words} />
    </article>
  );
}

function FixAct({ card, words }: { card: ImportCardView; words: CatalogImportWords }) {
  const leaveOut = (
    <Button
      variant="secondary"
      size="sm"
      tone="danger"
      icon={<ImportGlyph name="minus-circle" size="sm" stroke={1.8} />}
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
        <div className="hg-import-fix" data-act="answer">
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
        </div>
      );
    case 'pick':
    case 'kind':
      return <KindFix card={card} words={words} leaveOut={leaveOut} />;
    case 'repeat':
      return (
        <div className="hg-import-fix" data-act="repeat">
          <Button
            variant="secondary"
            size="sm"
            disabled={card.busy}
            onClick={() => card.choose({ act: 'repeat' })}
          >
            {words.useThisPrice}
          </Button>
          {leaveOut}
        </div>
      );
    case 'none':
      return <div className="hg-import-fix">{leaveOut}</div>;
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
    <div className="hg-import-fix" data-act="price">
      <div className="hg-import-fix-price">
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
      </div>
      <div className="hg-import-fix-acts">
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
      </div>
    </div>
  );
}

/**
 * *Which product is it?* over the candidates, or *Kind* over every kind. Two candidates of one
 * kind cannot be told apart by the answer, so that card offers *Leave out* only.
 */
function KindFix({ card, words, leaveOut }: FixProps) {
  if (card.act === 'pick' && !pickAnswers(card)) {
    return <div className="hg-import-fix">{leaveOut}</div>;
  }
  const pick = card.act === 'pick';
  return (
    <div className="hg-import-fix" data-act="kind">
      <div className="hg-import-fix-select">
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
      </div>
      {leaveOut}
    </div>
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
  const target = useFocusOnMount<HTMLElement>(focus);
  return (
    <article ref={target} tabIndex={-1} className="hg-import-fixed">
      <ImportGlyph name="tick" size="md" stroke={2.2} className="hg-import-fixed-mark" />
      <div className="hg-import-card-words">
        <span className="hg-import-line" data-weight="bold">
          {title}
        </span>
        <Text variant="caption" color="secondary">
          {line}
        </Text>
      </div>
      <Button variant="ghost" size="sm" onClick={onUndo}>
        {words.undo}
      </Button>
    </article>
  );
}
