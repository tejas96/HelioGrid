import { LEAD_DETAIL_SECTIONS, type LeadDetailSection } from '@heliogrid/domain';
import { useId } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { Card } from '../Card';
import { LeadSectionPanel } from './LeadSectionPanel';
import type { LeadSectionsProps } from './LeadSections.types';

/**
 * The lead's six sections as tabs (`M02-32`): one strip, each tab with its count where it has one,
 * over the one panel in view, named by its tab.
 */
export function LeadSections(props: LeadSectionsProps) {
  const { section, onSection, counts, words } = props;
  const base = useId();
  const tabId = (each: LeadDetailSection) => `${base}-tab-${each}`;
  return (
    <div className="hg-lead-sections">
      <div className="hg-lead-sections-tabs" role="tablist" aria-label={words.tabsLabel}>
        {LEAD_DETAIL_SECTIONS.map((each) => {
          const count = counts[each];
          return (
            <span
              key={each}
              id={tabId(each)}
              role="presentation"
              className="hg-lead-sections-tab-slot"
            >
              <Pressable
                className="hg-lead-sections-tab"
                accessibilityRole="tab"
                accessibilityState={{ selected: each === section }}
                haptic="selection"
                onPress={() => onSection(each)}
              >
                <span className="hg-lead-sections-tab-word">{words.tabs[each]}</span>
                {count === null ? null : (
                  <span className="hg-lead-sections-tab-count">{count}</span>
                )}
              </Pressable>
            </span>
          );
        })}
      </div>
      <Card className="hg-lead-sections-panel">
        <div role="tabpanel" aria-labelledby={tabId(section)} className="hg-lead-sections-body">
          <LeadSectionPanel {...props} />
        </div>
      </Card>
    </div>
  );
}
