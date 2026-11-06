import { DoorCodeStep, type DoorCodeStepProps } from '@heliogrid/ui';
import { InsetDoor } from './InsetDoor';
import { useHardwareBack } from './use-hardware-back';

/**
 * The code step under the phone's insets. Android's back button takes it back to the number, as
 * *Change number* does: the step is a state of the door, not a route, so the navigator would
 * close the app.
 */
export function InsetCodeStep(props: DoorCodeStepProps) {
  useHardwareBack(() => props.onPress('change-number'));
  return (
    <InsetDoor>
      <DoorCodeStep {...props} />
    </InsetDoor>
  );
}
