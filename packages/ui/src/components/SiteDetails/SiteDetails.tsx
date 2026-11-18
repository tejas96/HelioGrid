import { SITE_NAME_MAX } from '@heliogrid/domain';
import { Text } from '../../primitives/Text/Text';
import { Input } from '../Input/Input';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { SiteConnectionFields } from './SiteConnectionFields';
import { mountOf, mountOptionsOf } from './SiteDetails.logic';
import type { SiteDetailsProps } from './SiteDetails.types';
import { SiteFormBar } from './SiteFormBar';
import { SiteLocationField } from './SiteLocationField';
import { SitePinMap } from './SitePinMap';
import './SiteDetails.css';

/**
 * Site details on the web (`SCR-M05-01`): one flat grid — two columns where the room is wide, one
 * where it is narrow — and the bar that stays in view under it. The page's own head is the app's.
 */
export function SiteDetails(props: SiteDetailsProps) {
  const { room, form, saving, acts, words } = props;
  return (
    <div className="hg-site" data-room={room}>
      {props.head === undefined ? null : <div className="hg-site-head">{props.head}</div>}
      <div className="hg-site-grid">
        <Input
          label={words.name}
          value={form.name}
          maxLength={SITE_NAME_MAX}
          disabled={saving}
          onChange={acts.onName}
        />
        <div className="hg-site-field">
          <SegmentedControl
            label={words.mount}
            fill
            value={form.mount}
            options={mountOptionsOf(words)}
            onChange={(value) => {
              const mount = mountOf(value);
              if (mount !== null && !saving) acts.onMount(mount);
            }}
          />
          <Text variant="field-helper" color="secondary">
            {words.mountHelp[form.mount]}
          </Text>
        </div>
        <SiteLocationField
          form={form}
          search={props.search}
          saving={saving}
          acts={acts}
          words={words}
        />
        <SitePinMap
          room={room}
          form={form}
          pin={props.pin}
          pinMoved={props.pinMoved}
          map={props.map}
          saving={saving}
          acts={acts}
          words={words}
        />
        <SiteConnectionFields
          room={room}
          form={form}
          areas={props.areas}
          operators={props.operators}
          saving={saving}
          acts={acts}
          words={words}
        />
      </div>
      <SiteFormBar
        room={room}
        form={form}
        saving={saving}
        failure={props.failure}
        acts={acts}
        words={words}
      />
    </div>
  );
}
