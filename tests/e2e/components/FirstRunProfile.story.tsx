import {
  type FirstRunProfileEvent,
  firstRunProfileFrame,
  firstRunProfileReducer,
  firstRunProfileStart,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, firstRunProfileWords } from '@heliogrid/i18n';
import { FirstRunProfile } from '@heliogrid/ui';
import { useReducer, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

export const FACTS = {
  inviterName: 'Rajesh Kulkarni',
  invitedName: 'Anjali Kulkarni',
  companyName: 'Suryodaya Solar',
};

/** A picture any browser draws: one accent pixel, as a chosen photo's object URL would. */
export const PICTURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="%23e4572e"/></svg>';

/**
 * The screen as its route holds it, at the frame `events` lead to (`null` start: `loading`), its
 * words `firstRunProfileWords` in the reader's language. Each act goes through the reducer and
 * writes its name to `pressed`, where a spec reads it; a chosen photo is a PNG of `PICTURE`.
 */
export function FirstRunProfileAt({
  reader,
  events,
  arrived = true,
}: {
  reader: UiLanguage;
  events: readonly FirstRunProfileEvent[];
  arrived?: boolean;
}) {
  const [state, dispatch] = useReducer(
    firstRunProfileReducer,
    events.reduce(firstRunProfileReducer, firstRunProfileStart(arrived ? FACTS.invitedName : null)),
  );
  const [pressed, setPressed] = useState('');
  const frame = firstRunProfileFrame(state);
  const act = (name: string, event?: FirstRunProfileEvent) => () => {
    setPressed(name);
    if (event !== undefined) dispatch(event);
  };
  return (
    <div lang={reader}>
      <FirstRunProfile
        language={<span>{reader}</span>}
        words={firstRunProfileWords(READERS[reader].t, frame, FACTS)}
        frame={frame}
        name={state.name}
        picture={PICTURE}
        onName={(name) => dispatch({ type: 'name-typed', name })}
        onChoosePhoto={act('choose', {
          type: 'photo-chosen',
          image: { contentType: 'image/png', byteSize: 1_000, picture: PICTURE },
        })}
        onDropPhoto={(file) => {
          setPressed(`drop:${file.name}`);
          dispatch({
            type: 'photo-chosen',
            image: { contentType: file.type ?? '', byteSize: file.size ?? 0, picture: PICTURE },
          });
        }}
        onRemovePhoto={act('remove', { type: 'photo-removed' })}
        onRetryPhoto={act('retry-photo', { type: 'retry-photo' })}
        onSave={act('save', { type: 'save' })}
      />
      <output data-testid="pressed">{pressed}</output>
    </div>
  );
}
