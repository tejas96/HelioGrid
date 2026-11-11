import { type RefObject, useRef } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { packLineOf } from './HandoverPanel.logic';
import type { HandoverPackProps } from './HandoverPanel.types';

/**
 * The handover pack's tile: what it holds — or will, made at the handover — and once handed over,
 * its download while the server makes it (busy), once it is made, or its retry when it is late.
 * The line is a status, so a screen reader hears the pack arrive; *Try again* hands focus to the
 * tile, which stays while it looks.
 */
export function HandoverPack({ words, pack, onDownload, onLookAgain }: HandoverPackProps) {
  const frame = useRef<HTMLDivElement>(null);
  return (
    <Card className="hg-handover-pack">
      <div ref={frame} tabIndex={-1} className="hg-handover-pack-row hg-focus-target">
        <span className="hg-handover-pack-mark">
          <ShellGlyph name="file" size="md" tone="accent" />
        </span>
        <span className="hg-handover-pack-words">
          <span className="hg-handover-pack-title">{words.packTitle}</span>
          <span className="hg-handover-pack-line" role="status">
            {packLineOf(words, pack)}
          </span>
        </span>
        {pack.kind === 'making' || pack.kind === 'ready' ? (
          <span className="hg-handover-pack-act">
            <Button
              variant="secondary"
              size="sm"
              loading={pack.kind === 'making'}
              icon={<ShellGlyph name="download" size="sm" tone="primary" />}
              onClick={() => {
                if (pack.kind === 'ready') onDownload(pack.fileId);
              }}
            >
              {words.download}
            </Button>
          </span>
        ) : null}
        {pack.kind === 'late' ? (
          <span className="hg-handover-pack-act">
            <LookAgain words={words} onLookAgain={onLookAgain} frame={frame} />
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/** *Try again* on a late pack: it gives way to the busy download, and focus lands on the tile. */
function LookAgain({
  words,
  onLookAgain,
  frame,
}: Pick<HandoverPackProps, 'words' | 'onLookAgain'> & {
  frame: RefObject<HTMLDivElement | null>;
}) {
  const leaving = useFocusAfter(frame);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ShellGlyph name="retry" size="sm" tone="primary" />}
      onClick={leaving(onLookAgain)}
    >
      {words.retry}
    </Button>
  );
}
