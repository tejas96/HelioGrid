/* This half is the WEB half and it reaches for real DOM globals. Sibling components import
   overlay barrels rather than `.native` paths, which drags this file into the native tsconfig's
   program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { CSSProperties, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { MenuItem, MenuProps } from './Menu.types';
import { MenuItemRow } from './MenuItemRow';
import { MenuTrigger } from './MenuTrigger';
import { menuRowKey, resolveMenuKey, walkableItems } from './menu-walk';

/** The menu's width is a live number; the rest of the geometry stays in Menu.css. */
type MenuVars = CSSProperties & Record<`--${string}`, string>;

interface WebMenuProps extends MenuProps {
  className?: string;
  style?: CSSProperties;
}

const FOCUSABLE = 'button,[href],[tabindex]:not([tabindex="-1"])';

/**
 * Actions / overflow menu with real menu semantics (`MS12-12`): button → menu → menuitem roles,
 * arrow-key navigation with wrap, Home/End, type-ahead, Escape, and focus returned to the trigger.
 *
 * A destructive item never relies on colour alone — it carries its own trash glyph, so the meaning
 * survives a colourblind reader and a greyscale print.
 *
 * `selection="single"` turns the list into a SWITCHER (`M13-10`): `menuitemradio`, `aria-checked`,
 * a tick as the non-colour channel, and a reserved tick column so labels stay put whichever entry
 * is current. Every later picker — language, tenant, saved view — takes this rather than copying
 * whatever the shell did.
 */
export function Menu({
  items = [],
  trigger,
  label = 'More actions',
  align = 'end',
  width = 220,
  selection = 'none',
  onSelect,
  disabled = false,
  className,
  style,
}: WebMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const entries = walkableItems(items);

  const focusTrigger = () => {
    const wrap = triggerRef.current;
    if (wrap === null) {
      return;
    }
    const target = wrap.matches(FOCUSABLE) ? wrap : wrap.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  };

  const close = (restore = true) => {
    setOpen(false);
    if (restore) {
      focusTrigger();
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: the first walkable index is read ONCE, as the menu opens — recomputing it on every items identity would fight the arrow keys.
  useEffect(() => {
    if (!open) {
      return;
    }
    setActive(entries[0]?.index ?? 0);
    const onDoc = (event: MouseEvent) => {
      const wrap = wrapRef.current;
      if (wrap !== null && !wrap.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      itemRefs.current[active]?.focus();
    }
  }, [open, active]);

  const choose = (item: MenuItem) => {
    if (item.disabled === true) {
      return;
    }
    close();
    item.onSelect?.();
    const key = item.key ?? item.label;
    if (onSelect !== undefined && key !== undefined) {
      onSelect(key);
    }
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const result = resolveMenuKey(event.key, entries, active);
    if (result.preventDefault) {
      event.preventDefault();
    }
    if (result.action === 'close-restore') {
      close();
    } else if (result.action === 'close-quiet') {
      close(false);
    } else if (result.action === 'move' && result.index !== undefined) {
      setActive(result.index);
    }
  };

  const vars: MenuVars = { '--hg-menu-w': `${width}px` };

  return (
    <span className={classNames('hg-menu', className)} ref={wrapRef} style={style}>
      <MenuTrigger
        disabled={disabled}
        label={label}
        onOpen={() => setOpen(true)}
        onToggle={() => setOpen((current) => !current)}
        open={open}
        trigger={trigger}
        wrapRef={triggerRef}
      />

      {open ? (
        // The key handler sits on the menu, not on each row: the walk is the menu's, and every
        // activation lives on the menuitem buttons inside it.
        <div
          aria-label={label}
          className="hg-menu-list"
          data-align={align}
          onKeyDown={onKey}
          role="menu"
          style={vars}
        >
          {items.map((item, index) =>
            item.separator === true ? (
              <div
                aria-hidden="true"
                className="hg-menu-separator"
                key={`separator-${menuRowKey(item, index)}`}
              />
            ) : (
              <MenuItemRow
                active={index === active}
                item={item}
                itemRef={(element) => {
                  itemRefs.current[index] = element;
                }}
                key={menuRowKey(item, index)}
                onHover={() => setActive(index)}
                onSelect={() => choose(item)}
                radio={selection === 'single'}
              />
            ),
          )}
        </div>
      ) : null}
    </span>
  );
}
