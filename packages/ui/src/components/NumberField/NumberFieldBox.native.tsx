import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { FIELD_BOX_EDGE, fieldBox, fieldBoxText } from '../../primitives/FieldBox/FieldBox.native';
import { GroundProvider, useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useFocusRequest } from '../../primitives/use-focus-request';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { CurrencyMark } from './CurrencyMark.native';
import { EMPTY_PLAIN_FIGURE } from './NumberField.logic';
import type { NumberDraftState } from './NumberField.state';
import type { NumberFieldWords } from './NumberField.types';

// web-only part: MarketProvider — the currency symbol is drawn by its child CurrencyMark.native.

const styles = StyleSheet.create({
  /* The well and its edge ring are FieldBox's; the padding gives up the edge's width so the
     figure sits where it did. */
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.layout['field-h'],
    minHeight: 44,
    paddingHorizontal: theme.spacing['sp-4'] - FIELD_BOX_EDGE,
  },
  boxFunctional: { height: 40 },
  /* The one large figure of a step (`hero`): a taller well. */
  boxHero: { height: 60 },
  boxSteppers: { paddingHorizontal: 0 },
  /* The figure is the field: no well, no edge, no inset — its holder draws the frame. */
  boxPlain: { height: 40, paddingHorizontal: 0 },
  boxPlainDense: { height: 32 },
  /* `Input`'s face: a typed figure reads as what was typed, from where the caret starts, and its
     unit closes the field at the end. */
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    /* Over the well's 1px edge, as `Input`'s field: the target is the well's whole 44. */
    marginVertical: -FIELD_BOX_EDGE,
    textAlign: 'left',
    fontFamily: theme.type.families.sans,
    fontSize: theme.type.field.value,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
    color: colors['text-primary'],
    padding: 0,
  },
  inputSteppers: { textAlign: 'center' },
  /* An amount is money, and money is mono wherever it is read (`F7-09`). */
  inputCurrency: { fontFamily: theme.type.families.mono },
  /* After the money face, so a hero amount reads in the display face as a hero figure does (§9). */
  inputHero: {
    fontFamily: theme.type.families.display,
    fontSize: theme.type.roles['card-title'].fontSize,
  },
  inputPlain: { marginVertical: 0, fontSize: theme.type.roles.h1.fontSize, letterSpacing: -0.5 },
  /* A plain figure in a dense row — a payment part's share — reads at the row's size. */
  inputPlainDense: { fontSize: theme.type.roles.h2.fontSize, letterSpacing: 0, textAlign: 'right' },
  step: { width: 44, flexShrink: 0, alignSelf: 'stretch' },
  unit: { paddingRight: theme.spacing['sp-1'] },
  figureFill: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
  },
  figureRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    /* iOS reports no baseline for a `TextInput`, so the unit is set on the figure's foot. */
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
  },
  stepDisc: {
    width: 56,
    margin: 10,
    borderRadius: theme.radius['r-md'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* A stepped hero — step 3's size: the figure large, sized to itself so the unit follows it, in a
     taller well, as the web half's `[data-hero][data-steppers]` draws it. */
  boxHug: { height: 76 },
  inputHug: {
    flex: 0,
    flexGrow: 0,
    /* Never a target narrower than a thumb; a short figure keeps its digits against the unit. */
    minWidth: theme.layout['touch-min'],
    textAlign: 'right',
    fontSize: theme.type.roles.display.fontSize,
    letterSpacing: -1.3,
  },
  /* The 44 figure's descent over the unit's: their baselines meet. */
  unitHug: { paddingRight: 0, marginBottom: 7 },
});

export interface NumberFieldBoxProps {
  draft: NumberDraftState;
  steppers: boolean;
  density: 'expressive' | 'functional';
  /** `NumberFieldProps.hero`. */
  hero: boolean;
  /** `NumberFieldProps.plain`. */
  plain: boolean;
  disabled: boolean;
  /** Refusal or error — the danger edge; while focused the edge is the focus ring instead. */
  danger: boolean;
  /** The field's accessible name — its `label`, or its `ariaLabel` when no label is drawn. */
  name?: TranslatedText;
  unit?: string;
  currency: boolean;
  /** `NumberFieldProps.focusRequest`. */
  focusRequest?: number;
  words: Pick<NumberFieldWords, 'decrease' | 'increase'>;
}

interface Look {
  readonly density: 'expressive' | 'functional';
  readonly hero: boolean;
  readonly steppers: boolean;
  readonly plain: boolean;
}

/** The box's own shape for its density and kind; the well is `fieldBox`'s, and a plain figure has none. */
function boxLook({ density, hero, steppers, plain }: Look) {
  const dense = density === 'functional';
  return [
    styles.box,
    dense ? styles.boxFunctional : null,
    hero ? styles.boxHero : null,
    steppers ? styles.boxSteppers : null,
    plain ? styles.boxPlain : null,
    plain && dense ? styles.boxPlainDense : null,
  ];
}

/** The figure's face: money's mono, a hero's display face, a plain figure's size. */
function inputLook({ density, hero, steppers, plain, currency }: Look & { currency: boolean }) {
  return [
    styles.input,
    steppers ? styles.inputSteppers : null,
    currency ? styles.inputCurrency : null,
    hero ? styles.inputHero : null,
    plain ? styles.inputPlain : null,
    plain && density === 'functional' ? styles.inputPlainDense : null,
  ];
}

/** One nudge target: a 44px Pressable, a disc on the field's fill in a stepped hero. */
function StepButton({
  disc,
  disabled,
  label,
  onPress,
  glyph,
}: {
  disc: boolean;
  disabled: boolean;
  label: TranslatedText;
  onPress: () => void;
  glyph: 'minus' | 'plus';
}) {
  /* The well is white wherever the field stands (`GroundProvider` below), so a disc is the fill. */
  const { controlFill } = useGround();
  return (
    <Pressable
      style={[styles.step, disc ? [styles.stepDisc, { backgroundColor: controlFill }] : null]}
      disabled={disabled}
      accessibilityLabel={label}
      onPress={onPress}
    >
      <ShellGlyph
        name={glyph}
        size="sm"
        ink={disabled ? colors['text-disabled'] : colors['text-secondary']}
      />
    </Pressable>
  );
}

/** The figure's unit: beside a stepped hero's figure at the body-lg size, else closing the field. */
function UnitMark({ unit, hug }: { unit: string; hug: boolean }) {
  return (
    <Text
      variant={hug ? 'body-lg' : 'body-sm'}
      color="secondary"
      style={hug ? styles.unitHug : styles.unit}
    >
      {unit}
    </Text>
  );
}

/** The control itself: the two nudge targets (each a Pressable, so each is 44px), and the figure. */
export function NumberFieldBox({
  draft,
  steppers,
  density,
  hero,
  plain,
  disabled,
  danger,
  name,
  unit,
  currency,
  focusRequest,
  words,
}: NumberFieldBoxProps) {
  const control = useRef<TextInput>(null);
  useFocusRequest(control, focusRequest);
  /* The step's one large figure between its steppers: the unit sits beside the figure, as the
     web's `field-sizing` draws it, never pushed to the field's edge. */
  const hug = hero === true && steppers === true && unit !== undefined;
  /* Its steppers are discs on the field's own fill, as the web's size field draws them. */
  const disc = hug;
  return (
    <GroundProvider ground="tile">
      <View
        style={[
          boxLook({ density, hero, steppers, plain }),
          hug ? styles.boxHug : null,
          plain
            ? null
            : fieldBox({
                focused: draft.focus,
                tone: danger ? 'error' : 'none',
                disabled,
                density,
              }),
        ]}
      >
        {steppers ? (
          <StepButton
            disc={disc}
            disabled={disabled}
            label={words.decrease(name)}
            onPress={() => draft.nudge(-1)}
            glyph="minus"
          />
        ) : null}
        {currency ? <CurrencyMark side="before" /> : null}
        <View style={hug ? styles.figureRow : styles.figureFill}>
          <TextInput
            ref={control}
            style={[
              inputLook({ density, hero, steppers, plain, currency }),
              hug ? styles.inputHug : null,
              fieldBoxText(disabled),
            ]}
            keyboardType="decimal-pad"
            multiline={false}
            numberOfLines={1}
            placeholder={plain ? EMPTY_PLAIN_FIGURE : undefined}
            placeholderTextColor={colors['text-tertiary']}
            value={draft.draft}
            editable={!disabled}
            accessibilityLabel={name}
            accessibilityState={{ disabled }}
            onChangeText={draft.setDraft}
            onFocus={draft.onFocus}
            onBlur={draft.onBlur}
            onSubmitEditing={draft.commit}
          />
          {currency ? <CurrencyMark side="after" /> : null}
          {unit !== undefined && !currency ? <UnitMark unit={unit} hug={hug} /> : null}
        </View>
        {steppers ? (
          <StepButton
            disc={disc}
            disabled={disabled}
            label={words.increase(name)}
            onPress={() => draft.nudge(1)}
            glyph="plus"
          />
        ) : null}
      </View>
    </GroundProvider>
  );
}
