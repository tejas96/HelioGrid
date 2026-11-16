import { type RefObject, useRef } from 'react';
import { View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Rising } from '../../primitives/rising.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { categoryHueOf, hueTintOf } from '../Avatar/Avatar.logic';
import { Button } from '../Button/Button.native';
import { ShowMore } from '../CatalogItems/ShowMore.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { SearchField } from '../SearchField/SearchField.native';
import type { PartOption, ProposalPartPickerProps } from './ProposalPartSheets.types';
import { sheetLayout } from './sheet-layout.native';

// web-only part: ProposalBuilder — the web takes only riseOrder for its CSS stagger; the phone uses Rising.

/** A brand's letter mark: the first letter on the hue its name earns. */
export function BrandMark({ brand }: { brand: string; large?: boolean }) {
  const tint = hueTintOf(categoryHueOf(brand));
  return (
    <View
      style={[sheetLayout.mark, { backgroundColor: tint.bg }]}
      importantForAccessibility="no-hide-descendants"
    >
      <Text variant="body" bold style={{ color: tint.fg }}>
        {brand.trim().slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

function Option({ option, props }: { option: PartOption; props: ProposalPartPickerProps }) {
  return (
    <Pressable
      style={[tileSurface, sheetLayout.row, option.picked ? sheetLayout.rowOn : undefined]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: option.picked }}
      disabled={props.full && !option.picked}
      onPress={() => props.onToggle(option.key)}
    >
      <GroundProvider ground="tile">
        <BrandMark brand={option.brand} />
        <View style={sheetLayout.words}>
          <Text variant="body" bold>
            {option.brand}
          </Text>
          <Text variant="body-sm" color="secondary">
            {option.line}
          </Text>
        </View>
        {option.mark === undefined ? null : (
          <View style={sheetLayout.flag}>
            <ShellGlyph name="shield-check" size="sm" tone="success" />
            <Text variant="caption" color="success" bold>
              {option.mark}
            </Text>
          </View>
        )}
        <View style={[sheetLayout.check, option.picked ? sheetLayout.checkOn : undefined]}>
          {option.picked ? <ShellGlyph name="check" size="sm" tone="inverse" /> : null}
        </View>
      </GroundProvider>
    </Pressable>
  );
}

function Options({ props }: { props: ProposalPartPickerProps }) {
  const { options, words } = props;
  /* *Show more* leaves with the last page; the screen reader then lands on the list it grew. */
  const list = useRef<View>(null);
  if (options === null) {
    return <LoadingBars label={words.loading} bars={['option', 'option', 'option']} />;
  }
  if (options.length === 0) {
    return (
      <Text variant="body-sm" color="secondary">
        {props.search.trim() === '' ? words.empty : words.none}
      </Text>
    );
  }
  return (
    <>
      <View ref={list} style={sheetLayout.list}>
        {options.map((option, index) => (
          <Rising key={option.key} order={index}>
            <Option option={option} props={props} />
          </Rising>
        ))}
      </View>
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
      desktop="modal"
      showClose
      title={words.title}
      footer={
        <Button variant="primary" size="lg" fullWidth onClick={props.onClose}>
          {words.done}
        </Button>
      }
    >
      <View style={sheetLayout.body}>
        <SearchField
          value={props.search}
          onChange={props.onSearch}
          placeholder={words.search}
          onClear={() => props.onSearch('')}
          clearLabel={words.clearSearch}
        />
        {props.refusal || props.full ? (
          <View style={sheetLayout.hint} accessibilityLiveRegion="polite">
            <ShellGlyph name={props.refusal ? 'alert-circle' : 'info'} size="sm" tone="warning" />
            <View style={sheetLayout.words}>
              <Text variant="body-sm" color="warning">
                {props.refusal || words.full}
              </Text>
            </View>
          </View>
        ) : null}
        <Options props={props} />
        {picked.map((option) => (
          <Pressable
            key={option.key}
            style={sheetLayout.link}
            onPress={() => props.onEdit(option.key)}
          >
            <ShellGlyph name="pencil" size="sm" tone="accent" />
            <Text variant="body-sm" color="accent" bold>
              {words.edit(option.brand)}
            </Text>
          </Pressable>
        ))}
        {words.scheme === undefined ? null : (
          <View style={sheetLayout.hint}>
            <ShellGlyph name="shield-check" size="sm" />
            <View style={sheetLayout.words}>
              <Text variant="body-sm" color="secondary">
                {words.scheme}
              </Text>
            </View>
          </View>
        )}
        {props.onAdd === undefined ? null : (
          <Pressable style={[sheetLayout.row, sheetLayout.outlined]} onPress={props.onAdd}>
            <ShellGlyph name="plus-circle" size="md" tone="accent" />
            <View style={sheetLayout.words}>
              <Text variant="body" color="accent" bold>
                {words.add}
              </Text>
              <Text variant="body-sm" color="secondary">
                {words.addLine}
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </EditorSurface>
  );
}

/** *Show more* under a kind with more saved parts than one page, or its loading row while it reads. */
function MoreParts({
  props,
  list,
}: {
  props: ProposalPartPickerProps;
  list: RefObject<View | null>;
}) {
  const { more, words } = props;
  if (more === undefined) return null;
  if (more.loading) return <LoadingBars label={words.loading} bars={['option']} />;
  return <ShowMore label={words.showMore} onMore={more.onMore} focusAfter={list} />;
}
