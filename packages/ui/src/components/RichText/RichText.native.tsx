import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { ToolCommand } from './RichText.commands';
import type { RichTextAt } from './RichText.edit';
import {
  insertAfter,
  marksAt,
  setHrefAt,
  setTextAt,
  toggleHeadingAt,
  toggleListAt,
  toggleLogoBlock,
  toggleMarkAt,
} from './RichText.edit';
import { EMPTY_RICH_TEXT, measure, richTextRows } from './RichText.model';
import type { RichTextProps, RichTextValue } from './RichText.types';
import { RichTextBlocks } from './RichTextBlocks.native';
import { RichTextToolbar } from './RichTextToolbar.native';
import { RichTextView, renderRichTextRows } from './RichTextView.native';

interface NativeRichTextProps extends RichTextProps {
  style?: StyleProp<ViewStyle>;
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  frame: {
    borderRadius: theme.radius['r-input-expressive'],
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    ...theme.elevation.e2,
  },
  frameFocus: { borderWidth: 2, borderColor: theme.colors.accent },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: 10,
    paddingBottom: theme.spacing['sp-2'],
  },
  href: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-input-functional'],
    backgroundColor: theme.colors['surface-alt'],
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles['body-sm'].fontSize,
    color: theme.colors['text-primary'],
  },
  apply: {
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['action-primary'],
  },
  body: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: theme.spacing['sp-1'] },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    marginTop: theme.spacing['sp-2'],
    marginHorizontal: 2,
  },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing['sp-3'] },
});

const BLANK: RichTextValue = { version: 1, blocks: [{ type: 'p', spans: [{ text: '' }] }] };

/**
 * Rich-text authoring on touch. Same value model, same closed mark set, same renderer.
 *
 * **The one real difference is granularity.** The web half edits a `contenteditable` and reads the
 * caret's selection; RN has no selection API a mark can be applied to, so bold, italic and link
 * apply to the block (or list item) holding the caret, and heading / bullets / numbers convert that
 * block. Everything this produces is inside the same whitelist and renders in `RichTextView`.
 */
export function RichText({
  value = EMPTY_RICH_TEXT,
  onChange,
  onCommit,
  label,
  helper,
  placeholder = 'Type the terms your customer will read.',
  minHeight = 260,
  maxLength,
  disabled = false,
  onLogoChange,
  templates,
  onLoadTemplate,
  onSaveAsTemplate,
  saveTemplateLabel = 'Save as template',
  pageEstimate,
  onMeasure,
  style,
}: NativeRichTextProps) {
  const [at, setAt] = useState<RichTextAt>({ block: 0 });
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState('https://');
  const [focus, setFocus] = useState(false);

  const working = value.blocks.length > 0 ? value : BLANK;
  const m = measure(working);
  const over = maxLength !== undefined && m.chars > maxLength;

  const emit = (next: RichTextValue) => {
    onChange?.(next);
    onMeasure?.(measure(next));
  };

  const run = (c: ToolCommand) => {
    if (disabled) return;
    if (c.key === 'bold') emit(toggleMarkAt(working, at, 'b'));
    else if (c.key === 'italic') emit(toggleMarkAt(working, at, 'i'));
    else if (c.key === 'h') emit(toggleHeadingAt(working, at));
    else emit(toggleListAt(working, at, c.key === 'ul' ? 'ul' : 'ol'));
  };

  const toggleLogo = () => {
    if (disabled) return;
    const next = toggleLogoBlock(working);
    emit(next);
    onLogoChange?.(!m.hasLogo, next);
  };

  return (
    <View style={style}>
      {label !== undefined ? (
        <Text variant="body-sm" color="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.frame, focus ? styles.frameFocus : null]}>
        <RichTextToolbar
          marks={marksAt(working, at)}
          disabled={disabled}
          hasLogo={m.hasLogo}
          linking={linking}
          templates={templates}
          saveTemplateLabel={saveTemplateLabel}
          onRun={run}
          onToggleLink={() => setLinking((v) => !v)}
          onToggleLogo={toggleLogo}
          onLoadTemplate={onLoadTemplate}
          onSaveAsTemplate={
            onSaveAsTemplate === undefined
              ? undefined
              : () => onSaveAsTemplate(value, measure(value))
          }
        />
        {linking ? (
          <View style={styles.linkRow}>
            <TextInput
              style={styles.href}
              value={href}
              accessibilityLabel="Link address"
              placeholder="https://"
              placeholderTextColor={theme.colors['text-tertiary']}
              autoCapitalize="none"
              onChangeText={setHref}
            />
            <Pressable
              style={styles.apply}
              accessibilityLabel="Add link"
              onPress={() => {
                emit(setHrefAt(working, at, href));
                setLinking(false);
              }}
            >
              <Text variant="body-sm" color="inverse">
                Add link
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.body, { minHeight }]}>
          <RichTextBlocks
            value={working}
            disabled={disabled}
            placeholder={placeholder}
            showPlaceholder={m.chars === 0 && !m.hasLogo}
            label={label}
            onCaret={(next) => {
              setFocus(true);
              setAt(next);
            }}
            onBlur={() => {
              setFocus(false);
              onCommit?.(working);
            }}
            onText={(target, text) => emit(setTextAt(working, target, text))}
            onEnter={(target) => emit(insertAfter(working, target))}
          />
        </View>
      </View>
      {/* The char count is REAL and ships. The page estimate is the caller's, and empty stays
          empty — the editor never prints "≈ 1 page" it cannot stand behind. */}
      <View style={styles.footer}>
        <Text variant="caption" color="tertiary">
          {helper}
        </Text>
        <View style={styles.count}>
          {pageEstimate}
          <Text variant="caption" color={over ? 'danger' : 'tertiary'}>
            {maxLength !== undefined
              ? `${m.chars}/${maxLength} characters`
              : `${m.chars} characters`}
          </Text>
        </View>
      </View>
    </View>
  );
}

RichText.View = RichTextView;
RichText.measure = measure;
RichText.rows = richTextRows;
RichText.renderRows = renderRichTextRows;
RichText.EMPTY = EMPTY_RICH_TEXT;
