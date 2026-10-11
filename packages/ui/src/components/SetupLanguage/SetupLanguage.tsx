import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { DoorFrame } from '../DoorFrame/DoorFrame';
import { DoorTitle } from '../DoorFrame/DoorTitle';
import { OptionCardGroup } from '../OptionCardGroup/OptionCardGroup';
import { TintedBlock } from '../TintedBlock/TintedBlock';
import type { SetupLanguageProps } from './SetupLanguage.types';

/**
 * The language step in the frame's two fields: the question, its ask and any finding about the
 * person in the identity half; the languages and the way on in the task. The languages are one
 * column until the task column has its whole measure, then one row; under the breakpoint the way
 * on is held at the window's foot.
 */
export function SetupLanguage({
  words,
  language,
  onChoose,
  saving,
  onContinue,
  onContinueAnyway,
}: SetupLanguageProps) {
  return (
    <DoorFrame
      trailing={null}
      taskMeasure="choices"
      column="deep"
      identity={
        <>
          <DoorTitle title={words.title} explainer={words.explainer} />
          {words.failure === null ? null : (
            <Banner kind="validation" title={words.failure.title} className="hg-door-finding">
              {words.failure.body}
            </Banner>
          )}
          {words.notice === null ? null : (
            <TintedBlock
              tone="info"
              title={words.notice}
              announce="status"
              className="hg-door-finding"
            />
          )}
        </>
      }
      footer={
        <div className="hg-setup-language-ways">
          <Button variant="primary" size="lg" loading={saving} onClick={onContinue}>
            {words.primary}
          </Button>
          {words.secondary === null ? null : (
            <Button variant="secondary" size="lg" disabled={saving} onClick={onContinueAnyway}>
              {words.secondary}
            </Button>
          )}
        </div>
      }
    >
      <div className="hg-setup-language-choices">
        <OptionCardGroup
          label={words.group}
          options={[...words.options]}
          value={language}
          onChange={(value) => {
            const chosen = words.options.find((option) => option.value === value);
            if (chosen !== undefined) onChoose(chosen.value);
          }}
        />
      </div>
    </DoorFrame>
  );
}
