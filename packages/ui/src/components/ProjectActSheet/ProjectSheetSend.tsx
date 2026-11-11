import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import type { ProjectSheetSendProps } from './ProjectActSheet.types';

/** A sheet's send at its foot: the refusal above it, its glyph, busy while the send is out. */
export function ProjectSheetSend({
  label,
  ready,
  pending,
  failure,
  onSend,
  glyph,
  destructive,
}: ProjectSheetSendProps) {
  return (
    <div className="hg-project-act-send">
      {failure === null ? null : (
        <p className="hg-project-act-failed" role="alert">
          {failure}
        </p>
      )}
      <Button
        variant={destructive ? 'destructive' : 'primary'}
        size="lg"
        fullWidth
        disabled={!ready}
        loading={pending}
        icon={glyph === null ? null : <ShellGlyph name={glyph} size="md" tone="inverse" />}
        onClick={() => {
          if (ready && !pending) onSend();
        }}
      >
        {label}
      </Button>
    </div>
  );
}
