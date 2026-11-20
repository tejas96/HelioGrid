'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, ShellGlyph } from '@heliogrid/ui';
import type { Ref } from 'react';

/**
 * The one bottom bar: the site's name, one sentence of where the roof stands, and the step's acts.
 * Before a roof exists the acts are drawing it or setting it up with AI — or, with no picture,
 * drawing on the grid or typing its size. Each is coming soon, and says so on a tap.
 */
export function StudioBottomBar({
  barRef,
  name,
  status,
  noPicture,
  editable,
  words,
}: {
  barRef: Ref<HTMLDivElement>;
  name: TranslatedText;
  status: TranslatedText;
  noPicture: boolean;
  editable: boolean;
  words: StudioCanvasWords;
}) {
  return (
    <div ref={barRef} className="hg-studio-glass hg-studio-bar">
      <span className="hg-studio-bar-mark" aria-hidden>
        <ShellGlyph name={noPicture ? 'ruler' : 'spark'} size="sm" />
      </span>
      <span className="hg-studio-bar-words">
        <span className="hg-studio-bar-name">{name}</span>
        <span className="hg-studio-bar-status">{status}</span>
      </span>
      {editable ? (
        <span className="hg-studio-bar-acts">
          <Button
            variant="secondary"
            size="md"
            disabled
            disabledReason={words.drawComing}
            icon={<ShellGlyph name="pencil" size="sm" />}
          >
            {noPicture ? words.drawOnGrid : words.drawMyself}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled
            disabledReason={noPicture ? words.typeComing : words.aiComing}
            icon={<ShellGlyph name={noPicture ? 'ruler' : 'spark'} size="sm" />}
          >
            {noPicture ? words.typeSize : words.setUpWithAi}
          </Button>
        </span>
      ) : null}
    </div>
  );
}
