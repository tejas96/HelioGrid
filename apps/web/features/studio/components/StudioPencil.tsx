'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, Pressable, ShellGlyph, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { usePressAway } from '../hooks/use-press-away';

/**
 * The pencil, the one door to the roofs (`T-M05-002`, part e): it does what the moment needs. With
 * no roof it draws. With roofs it carries their count on its corner, amber while one waits to be
 * checked, and a tap opens two buttons beside it: Roofs, and Draw. While drawing it is filled and
 * a tap stops. In 3D, and for a person who may only view, it is the roofs' own glyph and opens
 * Roofs at once.
 */
export function StudioPencil({
  studio,
  words,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const holder = useRef<HTMLSpanElement>(null);
  const { pencil, panel, roofList, moves } = studio;
  const { count, waiting } = roofList;
  const fan = panel.open === 'fan';
  usePressAway(holder, fan, moves.closePanel);
  const shown = format.number(count);
  const label = {
    draw: words.drawRoof,
    stop: words.stopDrawing,
    fan: words.pencilFan(count),
    roofs: words.roofsCount(count),
  }[pencil];
  const open = pencil === 'stop' || fan || (pencil === 'roofs' && panel.open === 'roofs');
  return (
    <span ref={holder} className="hg-studio-pencil" data-open={fan}>
      <IconButton
        label={label}
        variant={pencil === 'stop' ? 'dark' : 'surface'}
        pressed={open}
        onClick={moves.tapPencil}
      >
        <ShellGlyph name={pencil === 'roofs' ? 'house' : 'pencil'} size="md" />
      </IconButton>
      {(pencil === 'fan' || pencil === 'roofs') && count > 0 ? (
        <span className="hg-studio-pencil-badge" data-waits={waiting > 0} aria-hidden>
          {shown}
        </span>
      ) : null}
      {fan ? (
        <span className="hg-studio-glass hg-studio-fan">
          <Pressable
            className="hg-studio-fan-roofs"
            accessibilityLabel={words.roofsCount(count)}
            onPress={moves.openRoofs}
          >
            <span className="hg-studio-fan-glyph" data-waits={waiting > 0}>
              <ShellGlyph name="house" size="md" />
            </span>
            {shown}
          </Pressable>
          <IconButton label={words.drawRoof} variant="ghost" onClick={moves.drawAnother}>
            <span className="hg-studio-fan-draw">
              <ShellGlyph name="pencil" size="md" />
              <ShellGlyph name="plus" size="xs" tone="current" />
            </span>
          </IconButton>
        </span>
      ) : null}
    </span>
  );
}
