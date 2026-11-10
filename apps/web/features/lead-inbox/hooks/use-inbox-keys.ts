'use client';
import type { LeadInboxScreen } from '@heliogrid/data/react';
import { useEffect, useRef } from 'react';

/** A key typed into a field is the field's, never the inbox's. */
function typingIn(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** The digits give to the first nine faces, in the dock's order. */
const GIVE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * The stage's keys on the desktop (`SCR-M02-02`): 1–9 give the deck's lead to that face, J bins
 * it, ↓ and ↑ move along the queue. Off while the picker is open, while a field has the keyboard,
 * and under a modifier — the browser's own shortcuts stay its own.
 */
export function useInboxKeys(screen: LeadInboxScreen, on: boolean): void {
  const latest = useRef(screen);
  latest.current = screen;
  useEffect(() => {
    if (!on) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (typingIn(event.target)) return;
      const now = latest.current;
      if (now.picking !== null) return;
      const deck = now.view.deck;
      const press = keyedAct(now, deck?.lead.id ?? null, event.key);
      if (press === null) return;
      event.preventDefault();
      press();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on]);
}

function keyedAct(
  screen: LeadInboxScreen,
  deckId: string | null,
  key: string,
): (() => void) | null {
  if (key === 'ArrowDown') return () => screen.step(1);
  if (key === 'ArrowUp') return () => screen.step(-1);
  if (deckId === null) return null;
  if ((key === 'j' || key === 'J') && screen.canJunk) return () => screen.junk(deckId);
  const face = GIVE_KEYS.indexOf(key);
  const person = face === -1 ? undefined : screen.team.people[face];
  if (person === undefined || !screen.canAssign) return null;
  return () => screen.give(deckId, person);
}
