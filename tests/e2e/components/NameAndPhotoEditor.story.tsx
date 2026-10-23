import {
  type FirstRunProfileEvent,
  firstRunProfileFrame,
  firstRunProfileReducer,
  profileEditorStart,
  type UiLanguage,
} from '@heliogrid/domain';
import { createTranslator, nameAndPhotoEditorWords } from '@heliogrid/i18n';
import { NameAndPhotoEditor } from '@heliogrid/ui';
import { useReducer, useState } from 'react';

const READERS = {
  en: await createTranslator('en'),
  hi: await createTranslator('hi'),
  mr: await createTranslator('mr'),
};

/**
 * The *Edit name* editor as Profile & preferences holds it, over a stand-in page: domain's flow
 * from the saved name and photo, moved by `events` to the frame under test, then by taps. The frame
 * reports each *Save* press as `data-saves`, a close as `data-closed`, and the typed name as
 * `data-name`.
 */
export function NameAndPhotoEditorAsHeld({
  reader,
  saved = null,
  events = [],
}: {
  reader: UiLanguage;
  saved?: string | null;
  events?: readonly FirstRunProfileEvent[];
}) {
  const [state, dispatch] = useReducer(firstRunProfileReducer, undefined, () =>
    events.reduce(
      firstRunProfileReducer,
      profileEditorStart('Anjali Kulkarni', { held: saved !== null, picture: saved }),
    ),
  );
  const [saves, setSaves] = useState(0);
  const [open, setOpen] = useState(true);
  const frame = firstRunProfileFrame(state);
  const { photo } = state;
  const picture =
    photo.kind === 'saved' || photo.kind === 'chosen' ? (photo.picture ?? undefined) : undefined;
  return (
    <div
      lang={reader}
      data-saves={saves}
      data-closed={!open}
      data-name={state.name}
      style={{ position: 'relative', minHeight: '100dvh' }}
    >
      <NameAndPhotoEditor
        open={open}
        words={nameAndPhotoEditorWords(READERS[reader].t, frame)}
        frame={frame}
        name={state.name}
        picture={picture}
        onName={(name) => dispatch({ type: 'name-typed', name })}
        onChoosePhoto={() => undefined}
        onRemovePhoto={() => dispatch({ type: 'photo-removed' })}
        onRetryPhoto={() => dispatch({ type: 'retry-photo' })}
        onSave={() => {
          setSaves((count) => count + 1);
          dispatch({ type: 'save' });
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
