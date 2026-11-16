import { type ImportWizardFrame, importWizardGoesBack } from '@heliogrid/domain';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Stepper } from '../Stepper';
import type { CatalogImportWords } from './CatalogImport.types';

interface ImportHeadProps {
  words: CatalogImportWords;
  frame: ImportWizardFrame;
  step: number;
  /** The title's id: it names the sheet, which draws no title of its own. */
  titleId: string;
  onClose: () => void;
  onBack: () => void;
  onSteps: () => void;
}

/**
 * The 375 sheet's head: the round close, the title with the location line under it — which opens
 * the step list — *Back* from step 2, and the thin four-part step bar.
 */
export function ImportHead({
  words,
  frame,
  step,
  titleId,
  onClose,
  onBack,
  onSteps,
}: ImportHeadProps) {
  return (
    <div className="hg-import-head">
      <div className="hg-import-head-row">
        <IconButton label={words.close} size={40} variant="surface" onClick={onClose}>
          <ShellGlyph name="close" size="sm" tone="current" />
        </IconButton>
        <div className="hg-import-head-words">
          <span id={titleId} className="hg-import-head-title">
            {words.title}
          </span>
          <Pressable
            className="hg-import-location"
            accessibilityLabel={words.locationLabel(step)}
            onPress={onSteps}
          >
            <Text as="span" variant="caption" color="secondary">
              {words.location(step)}
            </Text>
            <span className="hg-import-location-chevron">
              <ShellGlyph name="chevron" size="xs" tone="current" />
            </span>
          </Pressable>
        </div>
        {importWizardGoesBack(frame) ? (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {words.back}
          </Button>
        ) : null}
      </div>
      <Stepper
        variant="bars"
        steps={[...words.steps]}
        current={step}
        label={words.stepsLabel}
        words={words.stepper}
      />
    </div>
  );
}
