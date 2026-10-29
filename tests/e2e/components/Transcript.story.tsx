import { actorClassWords, createTranslator, TRANSCRIPT, transcriptWords } from '@heliogrid/i18n';
import { Transcript, type TranscriptProps } from '@heliogrid/ui';

const en = await createTranslator('en');
const words = transcriptWords(en.t, actorClassWords(en.t));

/**
 * `Transcript` with its words bound in the browser: `count`, `language` and each named speaker
 * are functions the transcript calls while it renders, so they cannot be handed to `mount`.
 */
export function WordedTranscript(props: Pick<TranscriptProps, 'read' | 'turns' | 'currentAt'>) {
  return (
    <Transcript
      {...props}
      words={words}
      title={en.t(TRANSCRIPT.title)}
      emptyTitle={en.t(TRANSCRIPT.emptyTitle)}
      errorMessage={en.t(TRANSCRIPT.errorMessage)}
      unavailableTitle={en.t(TRANSCRIPT.unavailableTitle)}
    />
  );
}
