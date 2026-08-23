/* Transcript's clock and its language sentence — platform-neutral, so both halves say the same
   thing about the same call.

   THE LANGUAGE LABEL IS PER TRANSCRIPT, NOT PER TURN. M07-15 fixes the language per call and
   §M07.7 requires transcripts to stay in the call's language, LABELLED. No row permits a mid-call
   switch — and a recording can still contain one, which is why the label may not assert one
   language falsely. It therefore states the whole shape of what happened, in words:
     one language     "In Hindi"
     a switch         "In Hindi, switched to English at 2:38"
     not recorded     a NamedGap — "Language not recorded" — never a guess and never silence
   Per-turn `language` is accepted for exactly one job: deriving where the switch fell. */

import type { LanguageSwitch, TranscriptLanguage, TranscriptTurn } from './Transcript.types';

/** Seconds into the call as "m:ss". Null when there is no offset — a KB preview has none. */
export function clock(seconds?: number | null): string | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return null;
  }
  const n = Math.max(0, Math.round(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

export function languageName(language?: TranscriptLanguage): string | undefined {
  if (typeof language === 'string') {
    return language;
  }
  return language ? language.name : undefined;
}

/** The whole language fact as one sentence. Never one language when two were spoken. */
export function languageSentence(
  language?: TranscriptLanguage,
  switches?: LanguageSwitch[],
): string | null {
  const first = languageName(language);
  if (!first) {
    return null;
  }
  if (!switches || switches.length === 0) {
    return `In ${first}`;
  }
  const parts = switches.map((s) => {
    const at = clock(s.at);
    return at ? `${s.to} at ${at}` : s.to;
  });
  return `In ${first}, switched to ${parts.join(', then ')}`;
}

/** A switch is a change from the PREVIOUS turn's language, never the first turn's own label. */
export function deriveSwitches(
  turns: TranscriptTurn[],
  language?: TranscriptLanguage,
): LanguageSwitch[] {
  const out: LanguageSwitch[] = [];
  let held = languageName(language);
  for (const t of turns) {
    if (t.language && held && t.language !== held) {
      out.push({ to: t.language, at: t.at });
    }
    if (t.language) {
      held = t.language;
    }
  }
  return out;
}

/** Turn index → the language it switched to, so the flow can be marked where it happened. */
export function switchPoints(
  turns: TranscriptTurn[],
  language?: TranscriptLanguage,
): Record<number, string> {
  const marks: Record<number, string> = {};
  let held = languageName(language);
  turns.forEach((t, i) => {
    if (t.language && held && t.language !== held) {
      marks[i] = t.language;
    }
    if (t.language) {
      held = t.language;
    }
  });
  return marks;
}

/** The turn being played: `currentAt` has reached this turn and not yet the next one's offset. */
export function isCurrentTurn(turns: TranscriptTurn[], index: number, currentAt?: number): boolean {
  const turn = turns[index];
  if (currentAt === undefined || !turn || turn.at === undefined) {
    return false;
  }
  if (currentAt < turn.at) {
    return false;
  }
  const next = turns[index + 1];
  return index + 1 >= turns.length || next?.at === undefined || currentAt < next.at;
}

/** "12 turns · Suryodaya agent and Anil Kulkarni" — the count line always states the whole call. */
export function countLine(whole: number, agentName?: string, customerName?: string): string {
  const who = [agentName, customerName].filter(Boolean).join(' and ');
  return `${whole} turn${whole === 1 ? '' : 's'}${who ? ` · ${who}` : ''}`;
}
