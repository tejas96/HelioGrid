import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type {
  ActorClassName,
  ActorClassProps,
  ActorClassSpec,
  ActorGlyphName,
} from './ActorClass.types';
import { ACTOR_CLASSES, actorClassOptions, actorWords } from './ActorClass.types';

interface WebActorClassProps extends ActorClassProps {
  className?: string;
  style?: CSSProperties;
}

const PATHS: Record<Exclude<ActorGlyphName, 'agent'>, ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" />
    </>
  ),
  customer: <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-4.7A7.5 7.5 0 1 1 20 12z" />,
};

/** The class's glyph. The agent's is a gradient object, not an outlined icon (ICONOGRAPHY). */
export function ActorGlyph({
  actorClass = 'system',
  size = 13,
}: {
  actorClass?: ActorClassName;
  size?: number;
}) {
  if (actorClass === 'agent') {
    const vars = { '--hg-actor-glyph-size': `${size - 2}px` } as CSSProperties;
    return <span aria-hidden="true" className="hg-actor-glyph-agent" style={vars} />;
  }
  const glyph = ACTOR_CLASSES[actorClass].glyph;
  return (
    <svg
      className="hg-actor-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph === 'agent' ? PATHS.cog : PATHS[glyph]}
    </svg>
  );
}

/**
 * Who or what did this, in words, with a glyph as the second channel. `form="origin"` plus `verb`
 * is how a human reopen stays distinguishable from an automatic resurface (SCR-M07-04).
 */
export function ActorClass({
  actorClass = 'system',
  actor,
  form = 'stream',
  verb = 'Created by',
  rule,
  size = 12,
  color = 'var(--text-secondary)',
  className,
  style,
}: WebActorClassProps) {
  const descriptor = ACTOR_CLASSES[actorClass];
  const vars = { '--hg-actor-fs': `${size}px`, color } as CSSProperties;
  return (
    <span className={classNames('hg-actor-class', className)} style={{ ...vars, ...style }}>
      <span className="hg-actor-class-mark" data-tone={descriptor.tone}>
        <ActorGlyph actorClass={actorClass} size={size + 1} />
      </span>
      <span className="hg-actor-class-words">
        {actorWords({ actorClass, actor, form, verb, rule })}
      </span>
    </span>
  );
}

/** Accepts a spec object, a bare class string, or a ready node — so every host offers one prop. */
export function renderActorClass(spec?: ActorClassSpec, extra?: ActorClassProps): ReactNode {
  if (spec === undefined) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <ActorClass actorClass={spec} {...extra} />;
  return <ActorClass {...spec} {...extra} />;
}

ActorClass.options = actorClassOptions;
ActorClass.classes = ACTOR_CLASSES;
ActorClass.Glyph = ActorGlyph;
