import { Input } from '../Input/Input';
import { Switch } from '../Switch/Switch';
import './SchemeSwitchRow.css';
import type { SchemeSwitchRowProps } from './CatalogItemForm.parts.types';

/**
 * One declared scheme (`SCR-M01-16`): its switch across the row, the words at the start and the
 * switch at the end; switched on, a list scheme asks for its reference under it. On, the row
 * takes the success wash; off, it lies white on the card inside its own thin edge.
 */
export function SchemeSwitchRow(props: SchemeSwitchRowProps) {
  const { scheme, words, held, error, focusRequest, disabled, onChange } = props;
  const asksReference = held.on && words.reference !== null;
  return (
    <div className="hg-item-scheme" data-on={held.on} data-reference={asksReference}>
      <Switch
        className="hg-item-scheme-switch"
        label={words.label}
        checked={held.on}
        disabled={disabled}
        onChange={(on) => onChange({ type: 'scheme', scheme, on })}
      />
      {asksReference ? (
        <Input
          label={words.reference ?? undefined}
          value={held.reference}
          onChange={(value) => onChange({ type: 'reference', scheme, value })}
          density="functional"
          error={error}
          disabled={disabled}
          focusRequest={focusRequest}
        />
      ) : null}
    </div>
  );
}
