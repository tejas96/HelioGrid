import type { Animated as RNAnimated } from 'react-native';
import { Animated, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { renderProvenance } from '../Provenance/Provenance.native';
import { bestPerAttribute } from './CompareGrid.logic';
import type { CompareAttribute, CompareOption, CompareProvenanceSpec } from './CompareGrid.types';
import { cellBoxes, cellGround, compareStyles, type Density } from './CompareGridStyles.native';
import { CompareOptionHead } from './CompareOptionHead.native';
import { CompareValueCell } from './CompareValueCell.native';

/**
 * **The row's tier, under its label.** A `provenance` prop is a SPEC, not a node — `Provenance`
 * owns the tier's word, its mark and the standing that outranks it — so it goes through
 * `renderProvenance`, and the slot disappears when the spec would render nothing.
 */
function AttributeProvenance({ spec }: { spec: CompareProvenanceSpec }) {
  const node = renderProvenance(spec, { size: 12 });
  if (node === null) return null;
  return <View style={compareStyles.provenance}>{node}</View>;
}

interface GridProps<Opt extends CompareOption> {
  attributes: CompareAttribute<Opt>[];
  options: Opt[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  selectLabel: string;
  selectedLabel: string;
  currentLabel: string;
  density: Density;
  columnWidth: number;
  labelWidth: number;
  scrollX: RNAnimated.Value;
}

/**
 * One table, not N cards. Alignment is structural — every row is a flex row of fixed-width cells,
 * so payback cannot drift between variants however long a name is, and the label column is pinned.
 *
 * This file owns only that structure: the heading of each column, the words inside each cell and
 * the choice at the foot are components of their own.
 */
export function CompareGridTable<Opt extends CompareOption>({
  attributes,
  options,
  selectedKey,
  onSelect,
  selectLabel,
  selectedLabel,
  currentLabel,
  density,
  columnWidth,
  labelWidth,
  scrollX,
}: GridProps<Opt>) {
  const best = bestPerAttribute(attributes, options);
  const isSelected = (option: Opt) => selectedKey !== undefined && option.key === selectedKey;
  const box = cellBoxes(density, labelWidth, columnWidth);
  const pinTransform = { transform: [{ translateX: scrollX }] };

  return (
    <View style={compareStyles.table}>
      <View style={compareStyles.row}>
        <Animated.View style={[compareStyles.pin, box.pin, pinTransform]} />
        {options.map((option) => (
          <CompareOptionHead
            key={option.key}
            option={option}
            selected={isSelected(option)}
            selectedLabel={selectedLabel}
            currentLabel={currentLabel}
            box={box.cell}
          />
        ))}
      </View>

      {attributes.map((attribute, index) => {
        const zebra = index % 2 === 1;
        return (
          <View key={attribute.key} style={compareStyles.row}>
            <Animated.View
              style={[compareStyles.pin, box.pin, cellGround(false, zebra), pinTransform]}
            >
              <Text variant="caption" color="secondary" style={{ fontWeight: '500' }}>
                {attribute.label}
              </Text>
              {attribute.unit === undefined ? null : (
                <Text variant="caption" color="tertiary">
                  {attribute.unit}
                </Text>
              )}
              <AttributeProvenance spec={attribute.provenance} />
            </Animated.View>
            {options.map((option) => (
              <CompareValueCell
                key={option.key}
                attribute={attribute}
                option={option}
                selected={isSelected(option)}
                zebra={zebra}
                best={best[attribute.key] === option.key}
                box={box.cell}
              />
            ))}
          </View>
        );
      })}

      {onSelect === undefined ? null : (
        <View style={compareStyles.row}>
          <Animated.View style={[compareStyles.pin, box.pin, pinTransform]} />
          {options.map((option) => (
            <View key={option.key} style={[box.cell, compareStyles.plain]}>
              {/* **The option in force says so.** The web half sets `aria-pressed` here
                  (`CompareGridTable.tsx:104`); the primitive's `accessibilityState.selected` is
                  the one declaration behind both, and without it the chosen option read as an
                  ordinary button and the choice was tint alone — `F7-12`. */}
              <Pressable
                accessibilityState={{ selected: isSelected(option) }}
                onPress={() => onSelect(option.key)}
                accessibilityLabel={`${isSelected(option) ? selectedLabel : selectLabel}: ${option.name}`}
                style={[
                  compareStyles.choose,
                  isSelected(option) ? compareStyles.chooseSelected : null,
                ]}
              >
                <Text
                  variant="body"
                  color={isSelected(option) ? 'accent' : 'inverse'}
                  style={{ fontWeight: '500' }}
                >
                  {isSelected(option) ? selectedLabel : selectLabel}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
