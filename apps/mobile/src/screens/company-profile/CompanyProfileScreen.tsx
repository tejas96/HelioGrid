import { InsetDoor } from '../shared/InsetDoor';
import { ProfileEditor } from './components/ProfileEditor';

/**
 * The third setup step on the phone (`SCR-M01-05`, `M01-24`), mounted for an owner whose company
 * still owes it: the profile in the door's inset.
 */
export function CompanyProfileScreen() {
  return (
    <InsetDoor>
      <ProfileEditor life="setup" />
    </InsetDoor>
  );
}
