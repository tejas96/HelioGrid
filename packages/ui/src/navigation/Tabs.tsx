'use client';
import * as RadixTabs from '@radix-ui/react-tabs';
import type { CSSProperties } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import './Tabs.css';

export interface TabItem {
  value: string;
  label: string;
}

/** _adherence allowlist: items, value, onChange, style. */
export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  style?: CSSProperties;
}

/** Underline tabs — 2px accent indicator slides between triggers. Radix tabs core (roving focus). */
export function Tabs({ items, value, onChange, style }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const triggers = list.querySelectorAll<HTMLElement>('.ui-tabs-trigger');
    const active = triggers[items.findIndex((t) => t.value === value)];
    if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
  }, [value, items]);

  return (
    <RadixTabs.Root
      className="ui-tabs"
      value={value}
      onValueChange={onChange}
      /* --ui-tabs-indicator-* carry DATA (measured trigger geometry), not visual constants */
      style={
        {
          ...style,
          '--ui-tabs-indicator-left': `${indicator.left}px`,
          '--ui-tabs-indicator-width': `${indicator.width}px`,
        } as CSSProperties
      }
    >
      <RadixTabs.List ref={listRef} className="ui-tabs-list">
        {items.map((t) => (
          <RadixTabs.Trigger key={t.value} value={t.value} className="ui-tabs-trigger">
            {t.label}
          </RadixTabs.Trigger>
        ))}
        <span className="ui-tabs-indicator" aria-hidden />
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
