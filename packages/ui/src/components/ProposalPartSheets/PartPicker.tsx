import { type RefObject, useRef } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { categoryHueOf } from '../Avatar/Avatar.logic';
import { Button } from '../Button/Button';
import { ShowMore } from '../CatalogItems/ShowMore';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import { riseOrder } from '../ProposalBuilder/rise';
import { SearchField } from '../SearchField/SearchField';
import type { PartOption, ProposalPartPickerProps } from './ProposalPartSheets.types';
import './ProposalPartSheets.css';

/** A brand's letter mark: the first letter on the hue its name earns. */
export function BrandMark({ brand, large = false }: { brand: string; large?: boolean }) {
  return (
    <span
      className="hg-pps-mark hg-hue"
      data-hue={categoryHueOf(brand)}
      data-large={large ? '' : undefined}
      aria-hidden="true"
    >
      {brand.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

function Option({
  option,
  index,
  props,
}: {
  option: PartOption;
  index: number;
  props: ProposalPartPickerProps;
}) {
  return (
    <Pressable
      className="hg-pps-option"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: option.picked }}
      disabled={props.full && !option.picked}
      onPress={() => props.onToggle(option.key)}
    >
      <span
        className="hg-pps-option-in hg-pps-tile"
        data-on={option.picked ? '' : undefined}
        style={riseOrder(index)}
      >
        <BrandMark brand={option.brand} large />
        <span className="hg-pps-option-words">
          <span className="hg-pps-option-brand">{option.brand}</span>
          <span className="hg-pps-option-line">{option.line}</span>
        </span>
        {option.mark === undefined ? null : (
          <span className="hg-pps-flag">
            <ShellGlyph name="shield-check" size="sm" />
            {option.mark}
          </span>
        )}
        <span className="hg-pps-check" data-on={option.picked ? '' : undefined}>
          {option.picked ? <ShellGlyph name="tick-small" size="sm" tone="inverse" /> : null}
        </span>
      </span>
    </Pressable>
  );
}

function Options({ props }: { props: ProposalPartPickerProps }) {
  const { options, words } = props;
  /* *Show more* leaves with the last page; focus then lands on the list it grew. */
  const list = useRef<HTMLDivElement>(null);
  if (options === null)
    return <LoadingBars label={words.loading} bars={['option', 'option', 'option']} />;
  if (options.length === 0) {
    return <p className="hg-pps-hint">{props.search.trim() === '' ? words.empty : words.none}</p>;
  }
  return (
    <>
      <div ref={list} tabIndex={-1} className="hg-pps-options hg-focus-target">
        {options.map((option, index) => (
          <Option key={option.key} option={option} index={index} props={props} />
        ))}
      </div>
      <MoreParts props={props} list={list} />
    </>
  );
}

/**
 * *Pick a part* (`M06-27`, `M06-28`): search, a tick per brand, the certification mark, and the
 * three-brand limit said in words — the one picker, which the design studio reuses.
 */
export function ProposalPartPicker(props: ProposalPartPickerProps) {
  const { words, options } = props;
  const picked = options?.filter((option) => option.picked) ?? [];
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.closeLabel}
      showClose
      title={words.title}
      desktop="modal"
      footer={
        <Button variant="primary" size="lg" fullWidth onClick={props.onClose}>
          {words.done}
        </Button>
      }
    >
      <div className="hg-pps-body">
        <SearchField
          value={props.search}
          onChange={props.onSearch}
          placeholder={words.search}
          onClear={() => props.onSearch('')}
          clearLabel={words.clearSearch}
        />
        {props.refusal ? (
          <p className="hg-pps-hint" data-tone="warning" role="alert">
            <ShellGlyph name="alert-circle" size="sm" tone="warning" />
            <span>{props.refusal}</span>
          </p>
        ) : props.full ? (
          <p className="hg-pps-hint" data-tone="warning" role="status">
            <ShellGlyph name="info-circle" size="sm" tone="warning" />
            <span>{words.full}</span>
          </p>
        ) : null}
        <Options props={props} />
        {picked.length === 0 ? null : (
          <div className="hg-pps-edits">
            {picked.map((option) => (
              <Pressable
                key={option.key}
                className="hg-pps-link"
                onPress={() => props.onEdit(option.key)}
              >
                <span className="hg-pps-link-in">
                  <ShellGlyph name="pencil" size="sm" />
                  {words.edit(option.brand)}
                </span>
              </Pressable>
            ))}
          </div>
        )}
        {words.scheme === undefined ? null : (
          <p className="hg-pps-hint">
            <ShellGlyph name="shield-check" size="sm" />
            <span>{words.scheme}</span>
          </p>
        )}
        {props.onAdd === undefined ? null : (
          <Pressable className="hg-pps-add" onPress={props.onAdd}>
            <span className="hg-pps-add-in">
              <ShellGlyph name="plus-circle" size="md" />
              <span className="hg-pps-option-words">
                <span className="hg-pps-add-title">{words.add}</span>
                <span className="hg-pps-option-line">{words.addLine}</span>
              </span>
            </span>
          </Pressable>
        )}
      </div>
    </EditorSurface>
  );
}

/** *Show more* under a kind with more saved parts than one page, or its loading row while it reads. */
function MoreParts({
  props,
  list,
}: {
  props: ProposalPartPickerProps;
  list: RefObject<HTMLDivElement | null>;
}) {
  const { more, words } = props;
  if (more === undefined) return null;
  if (more.loading) return <LoadingBars label={words.loading} bars={['option']} />;
  return <ShowMore label={words.showMore} onMore={more.onMore} focusAfter={list} />;
}
