import { useEffect, useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Card } from '../Card';
import { HeroPanel } from '../HeroPanel';
import type { MergeDoneProps } from './MergeCompare.types';
import { MergeMoves } from './MergeMoves';

/**
 * The calm end of a merge on the web: the one hero — a tick, "Merged.", what points where, and
 * *Open customer*, which takes the keyboard's focus as the done appears — then what moved.
 */
export function MergeDone({ words, onOpenCustomer, onBackToLeads }: MergeDoneProps) {
  const open = useRef<FocusHandle>(null);
  useEffect(() => {
    open.current?.focus();
  }, []);
  return (
    <>
      <HeroPanel name={words.title}>
        <div className="hg-merge-done">
          <span className="hg-merge-tick">
            <ShellGlyph name="tick" size="lg" tone="success" />
          </span>
          <h1 className="hg-merge-done-title">{words.title}</h1>
          <p className="hg-merge-done-line">{words.line}</p>
          <p className="hg-merge-done-by">{words.by}</p>
          <div className="hg-merge-done-acts">
            <Button
              ref={open}
              variant="primary"
              size="lg"
              icon={<ShellGlyph name="arrow-up-right" size="md" />}
              onClick={onOpenCustomer}
            >
              {words.openCustomer}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={<ShellGlyph name="chevron-left" size="md" />}
              onClick={onBackToLeads}
            >
              {words.backToLeads}
            </Button>
          </div>
        </div>
      </HeroPanel>
      <Card>
        <MergeMoves {...words.moved} tombstone={null} cannotUndo={null} />
      </Card>
    </>
  );
}
