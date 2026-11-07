import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { GlanceFact, GlanceStripProps } from './GlanceStrip.types';

/** Small facts in one glass capsule, split by hairlines (`GlanceStrip.css`). */
export function GlanceStrip({ facts, name }: GlanceStripProps) {
  return (
    <ul className="hg-glance" aria-label={name} data-count={facts.length}>
      {facts.map((fact) => (
        <li key={fact.key} className="hg-glance-cell">
          {fact.onPress === undefined ? (
            <div className="hg-glance-fact">
              <FactBody fact={fact} />
            </div>
          ) : (
            <Pressable
              className="hg-glance-fact hg-glance-press"
              onPress={fact.onPress}
              accessibilityLabel={fact.spokenName}
            >
              <FactBody fact={fact} />
            </Pressable>
          )}
        </li>
      ))}
    </ul>
  );
}

function FactBody({ fact }: { fact: GlanceFact }): ReactNode {
  return (
    <>
      <span className="hg-glance-label">
        {fact.icon === undefined ? null : <ShellGlyph name={fact.icon} size="sm" />}
        <span>{fact.label}</span>
        {fact.aside}
      </span>
      <span className="hg-glance-figure">
        <span className="hg-glance-value">{fact.value}</span>
        {fact.unit === undefined ? null : <span className="hg-glance-unit">{fact.unit}</span>}
      </span>
    </>
  );
}
