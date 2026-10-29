/* Timeline's pick mode (native) — the chain as a radio group, `SCR-M01-20`'s stage picker. The web
   half is `role="radiogroup"` named by `label`; here the role sits on a plain View and
   `accessibilityLabel` names it without making it a leaf, so each step stays separately
   reachable. The rail is neutral: nothing is done or current here, so nothing is lit. */

import type { TranslatedText } from '@heliogrid/contracts';
import { View } from 'react-native';
import { stepKeyOf } from './Timeline.logic';
import { pickedIndex } from './Timeline.pick';
import type { TimelineDensity, TimelineItem } from './Timeline.types';
import { TimelinePickStep } from './TimelinePickStep.native';

export function TimelinePick({
  items,
  value,
  onChange,
  label,
  density,
}: {
  items: TimelineItem[];
  value: string | undefined;
  onChange: (id: string) => void;
  label: TranslatedText | undefined;
  density: TimelineDensity;
}) {
  const picked = pickedIndex(items, value);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      {items.map((item, index) => (
        <TimelinePickStep
          key={stepKeyOf(item, index)}
          item={item}
          checked={index === picked}
          density={density}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onChoose={() => {
            if (item.id !== undefined) onChange(item.id);
          }}
        />
      ))}
    </View>
  );
}
