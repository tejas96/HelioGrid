import { useImperativeHandle, useRef } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { CardRow, CardRows } from '../CardRows';
import { HeroPanel } from '../HeroPanel';
import { sourceGlyphOf } from '../LeadSourceMark/LeadSourceMark.logic';
import type { InboxTeachingProps } from './InboxTeaching.types';

/**
 * The teaching inbox (`M02-25`): the hero says what will wait here and offers *Add a lead*; under
 * it, each way a lead arrives opens that way.
 */
export function InboxTeaching({ onAdd, onWay, ways, words, headingRef }: InboxTeachingProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(headingRef, () => ({
    focus: (options) => heading.current?.focus(options),
  }));
  return (
    <div className="hg-inbox-teaching">
      <HeroPanel name={words.title}>
        <div className="hg-inbox-teaching-head">
          <span className="hg-inbox-teaching-ring" aria-hidden="true">
            <ShellGlyph name="layers" size="md" tone="accent" />
          </span>
          <h2 ref={heading} tabIndex={-1} className="hg-inbox-teaching-title hg-focus-target">
            {words.title}
          </h2>
        </div>
        <p className="hg-inbox-teaching-body">{words.body}</p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<ShellGlyph name="plus" size="md" tone="inverse" />}
          onClick={onAdd}
        >
          {words.add}
        </Button>
      </HeroPanel>
      <h3 className="hg-inbox-teaching-over">{words.waysTitle}</h3>
      <CardRows>
        {ways.map((way, index) => (
          <CardRow
            key={way}
            first={index === 0}
            open={{ name: words.ways[way].title, onOpen: () => onWay(way) }}
            className="hg-inbox-teaching-way"
          >
            <span className="hg-inbox-teaching-glyph" data-way={way} aria-hidden="true">
              <ShellGlyph name={sourceGlyphOf(way)} size="md" tone="accent" />
            </span>
            <span className="hg-inbox-teaching-words">
              <span className="hg-inbox-teaching-way-title">{words.ways[way].title}</span>
              <span className="hg-inbox-teaching-way-line">{words.ways[way].line}</span>
            </span>
            <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
          </CardRow>
        ))}
      </CardRows>
    </div>
  );
}
