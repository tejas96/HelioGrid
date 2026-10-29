import type { TranslatedText } from '@heliogrid/contracts';
import { importWizardStepIndex } from '@heliogrid/domain';
import { Button } from '../Button';
import type { actOf } from './CatalogImport.steps';
import type { CatalogImportProps } from './CatalogImport.types';
import './ImportFoot.css';

type ImportAct = ReturnType<typeof actOf>;

interface ImportFootProps extends CatalogImportProps {
  act: ImportAct;
  wide: boolean;
}

/**
 * The step's act and the one line read before it. At 375 one full-width act with its line centred
 * under it; at 1536 *Back* (or *Close*, where there is nothing to go back to), the line and the act
 * share one row. A gated act says why in its bubble, never in a drawn line.
 */
export function ImportFoot(props: ImportFootProps) {
  const { act, wide } = props;
  const line = act === null ? quietLine(props) : act.line;
  const button =
    act === null ? null : (
      <Button
        // A new button per look: a fill fading between looks would draw the words on their own ink.
        key={act.secondary ? 'secondary' : 'primary'}
        variant={act.secondary ? 'secondary' : 'primary'}
        size="lg"
        fullWidth
        disabled={act.gate !== null}
        disabledReason={act.gate ?? undefined}
        onClick={act.onPress}
      >
        {act.label}
      </Button>
    );

  if (!wide) {
    return (
      <div className="hg-import-foot">
        {button}
        {line === null ? null : <p className="hg-import-foot-line">{line}</p>}
      </div>
    );
  }

  const closes = act === null || act.leading === 'close';
  const dismisses = closes || importWizardStepIndex(props.frame) === 0;
  return (
    <div className="hg-import-foot" data-wide="true">
      <Button variant="secondary" size="lg" onClick={dismisses ? props.onClose : props.onBack}>
        {closes ? props.words.close : props.words.back}
      </Button>
      <span className="hg-import-foot-line">{line}</span>
      {button === null ? null : <span className="hg-import-foot-act">{button}</span>}
    </div>
  );
}

/** The line of a report with no act: the kept report still opening, or kept. */
function quietLine(props: CatalogImportProps): TranslatedText | null {
  if (props.opening) return props.words.opening;
  return props.frame === 'report' ? props.words.kept : null;
}
