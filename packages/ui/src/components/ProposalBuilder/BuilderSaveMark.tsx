import { ShellGlyph } from '../AppShell/ShellGlyph';
import type { BuilderSave, ProposalBuilderWords } from './ProposalBuilder.types';

/**
 * The draft's save state beside the title (`T-M06-023`): a quiet *Saved* tick, or what stopped the
 * last commit — said once here, while the field that failed keeps its own line.
 */
export function BuilderSaveMark({
  save,
  words,
}: {
  save: BuilderSave | null;
  words: ProposalBuilderWords;
}) {
  if (save === null) return null;
  if (save.kind === 'saved' || save.kind === 'saving') {
    return (
      <span className="hg-pbf-save" role="status">
        {save.kind === 'saved' ? <ShellGlyph name="check" size="sm" tone="success" /> : null}
        {save.kind === 'saved' ? words.saved : words.saving}
      </span>
    );
  }
  return (
    <span className="hg-pbf-save" data-tone="warning" role="status">
      <ShellGlyph
        name={save.kind === 'offline' ? 'cloud-off' : 'alert-circle'}
        size="sm"
        tone="warning"
      />
      {save.kind === 'offline'
        ? words.offline
        : save.kind === 'conflict'
          ? words.conflict
          : words.unsaved(save.count)}
    </span>
  );
}
