import { theme } from '@heliogrid/theme';
import { Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
/* Cross-component imports in a native half point at the NATIVE file: a folder barrel re-exports
   `./<Name>`, which tsc's bundler resolution reads as the WEB half even in the native project. */
import { ComplianceFloor } from '../ComplianceFloor/ComplianceFloor.native';
import type { ComplianceFloorSpec } from '../ComplianceFloor/ComplianceFloor.types';
import { weekdayOf } from '../DatePicker/calendar-grid';
import type { MarketFormat } from '../DatePicker/DatePicker.types';
import { ValueSource } from '../ValueSource/ValueSource.native';
import type { DateSetEntry } from './DateSet.types';
import { floorFor } from './date-set-floor';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e1,
  },
  rowFunctional: { borderRadius: theme.radius['r-card-functional'] },
  rowBlocked: {
    backgroundColor: theme.colors['warning-bg'],
    shadowOpacity: 0,
    elevation: 0,
  },
  body: { flex: 1, minWidth: 0, gap: theme.spacing['sp-1'] },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: theme.spacing['sp-2'],
  },
  date: {
    fontFamily: theme.type.families.mono,
    fontSize: theme.type.roles['body-sm'].fontSize,
    color: theme.colors['text-primary'],
  },
  name: {
    fontFamily: theme.type.families.sans,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors['text-primary'],
  },
  delete: { width: 44, height: 44, borderRadius: theme.radius['r-pill'] },
});

export interface DateSetRowProps {
  entry: DateSetEntry;
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  /** True while this row's removal is the one that was just refused. */
  blocked: boolean;
  density: 'expressive' | 'functional';
  onRemove?: (date: string, spokenName: string) => void;
}

/** One date. Deletability follows origin: a tenant row has a 44dp delete, a pack row has the floor. */
export function DateSetRow({
  entry,
  mkt,
  packName,
  floor,
  blocked,
  density,
  onRemove,
}: DateSetRowProps) {
  const d = new Date(`${entry.date}T00:00:00`);
  const pack = entry.origin === 'pack';
  const spoken = entry.name ?? mkt.date(d);
  return (
    <View
      role="listitem"
      style={[
        styles.row,
        density === 'functional' ? styles.rowFunctional : undefined,
        blocked ? styles.rowBlocked : undefined,
      ]}
    >
      <View style={styles.body}>
        <View style={styles.head}>
          <RNText style={styles.date}>{mkt.date(d)}</RNText>
          <Text variant="caption" color="tertiary">
            {weekdayOf(d, mkt.weekdayNames('long'), mkt.firstDayOfWeek)}
          </Text>
        </View>
        {entry.name === undefined ? null : <RNText style={styles.name}>{entry.name}</RNText>}
        {/* Origin as persistent content — the same which-layer-supplied-this the rates panel
            renders, so it is the same component. Never a tone and never a tooltip (`F8-07`). */}
        <ValueSource
          level={pack ? 'inherited' : 'own'}
          layerName={pack ? packName : 'Added by you'}
          source={pack ? 'Market holiday' : (entry.addedBy ?? 'Tenant holiday')}
        />
        {/* Deletability follows origin: the floor takes the delete's place. */}
        {pack ? <ComplianceFloor {...floorFor(entry, packName, floor)} /> : null}
      </View>
      {!pack && onRemove !== undefined ? (
        <Pressable
          accessibilityLabel={`Remove ${spoken}`}
          onPress={() => onRemove(entry.date, spoken)}
          style={styles.delete}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"
              stroke={theme.colors['text-secondary']}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}
