import type { MyDay, MyDayItem } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import { Button } from '../Button/Button.native';
import { HeroPanel } from '../HeroPanel/HeroPanel.native';
import { IconButton } from '../IconButton/IconButton.native';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import { leadActOf, nameOf, positionOf, whenOf } from './MyDay.logic';
import type { MyDayProps } from './MyDay.types';

type HeroProps = MyDayProps & { readonly day: MyDay };

/**
 * The one task to do now on the phone (sample B, *Next up*): who, what and why, then *Call* — or
 * *Directions* to a visit — *Message* and the tick, with *Move to tomorrow* under them. After a
 * call it asks how the call went instead.
 */
export function NextUp(props: HeroProps) {
  const { asking, next } = props;
  if (asking !== null) return <AskingHero {...props} item={asking} />;
  if (next === null) return null;
  return <NextHero {...props} item={next} />;
}

function NextHero(props: HeroProps & { readonly item: MyDayItem }) {
  const { item, day, words, sending } = props;
  const format = useFormat();
  const name = nameOf(item, words);
  const when = whenOf(item, day, words, format);
  const position = positionOf(day, words);
  const act = leadActOf(item, props);
  const why = words.why(item);
  const bill = item.lead.monthlyBill;
  return (
    <HeroPanel
      label={words.nextUp}
      labelAside={
        <View style={styles.aside}>
          <StatusMark tone={when.tone} label={when.label} />
          {position === null ? null : (
            <Text variant="mono" color="secondary" oneLine>
              {position}
            </Text>
          )}
        </View>
      }
    >
      <View style={styles.block}>
        <Who name={name} line={[words.task(item), item.lead.city]} />
        {bill === null && why === null ? null : (
          <View style={styles.chips}>
            {bill === null ? null : (
              <HeroChip>
                <ShellGlyph name="rupee" size="sm" tone="secondary" />
                <Text variant="body-sm">{words.bill(format.money(bill.amount))}</Text>
                <ProvenanceTier tier={bill.tier} />
              </HeroChip>
            )}
            {why === null ? null : (
              <HeroChip>
                <ShellGlyph name="spark" size="sm" tone="accent" />
                <Text variant="body-sm">{why}</Text>
              </HeroChip>
            )}
          </View>
        )}
        <View style={styles.acts}>
          <View style={styles.act}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ShellGlyph name={act.glyph} size="sm" tone="inverse" />}
              disabled={act.off !== null}
              disabledReason={act.off ?? undefined}
              onClick={act.onPress}
            >
              {act.label}
            </Button>
          </View>
          <View style={styles.act}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              icon={<ShellGlyph name="chat" size="sm" tone="primary" />}
              onClick={() => props.onMessage(item)}
            >
              {words.message}
            </Button>
          </View>
          <IconButton
            size={48}
            label={words.doneName(name)}
            disabled={sending}
            onClick={() => props.onDone(item)}
          >
            <ShellGlyph name="tick" size="md" tone="success" />
          </IconButton>
        </View>
        <View style={styles.later}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ShellGlyph name="calendar" size="sm" tone="secondary" />}
            disabled={sending}
            onClick={() => props.onMoveToTomorrow(item)}
          >
            {words.moveToTomorrow}
          </Button>
        </View>
      </View>
    </HeroPanel>
  );
}

/** After *Call*: how did it go — answered or no answer — or not now. Inert while the answer is out. */
function AskingHero(props: HeroProps & { readonly item: MyDayItem }) {
  const { item, words, sending } = props;
  const name = nameOf(item, words);
  return (
    <HeroPanel label={words.nextUp}>
      <View style={styles.block}>
        <Who name={name} line={[words.task(item), item.lead.city]} />
        <Text variant="h2" live>
          {words.howDidItGo(name)}
        </Text>
        <View style={styles.acts}>
          <View style={styles.act}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={sending}
              icon={<ShellGlyph name="phone" size="sm" tone="inverse" />}
              onClick={() => props.onAnswer('answered')}
            >
              {words.answered}
            </Button>
          </View>
          <View style={styles.act}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              disabled={sending}
              onClick={() => props.onAnswer('no_answer')}
            >
              {words.noAnswer}
            </Button>
          </View>
        </View>
        <View style={styles.later}>
          <Button variant="ghost" size="sm" disabled={sending} onClick={props.onSkipAnswer}>
            {words.notNow}
          </Button>
        </View>
      </View>
    </HeroPanel>
  );
}

/** The lead's face and name as the hero's title, and what the task is and where, under it. */
function Who({ name, line }: { name: string; line: readonly (string | null)[] }) {
  return (
    <View style={styles.who}>
      <Avatar name={name} size={48} />
      <View style={styles.whoWords}>
        <Text variant="h1" twoLines>
          {name}
        </Text>
        <View style={styles.taskLine}>
          {line.map((part, index) =>
            part === null ? null : (
              <View key={part} style={styles.taskPart}>
                {index === 0 ? null : <View style={styles.dot} />}
                <Text variant="body-sm" color="secondary">
                  {part}
                </Text>
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );
}

/** A quiet glass chip on the hero: the bill, the why. */
function HeroChip({ children }: { children: ReactNode }) {
  const { controlFill } = useGround();
  return <View style={[styles.chip, { backgroundColor: controlFill }]}>{children}</View>;
}

const styles = StyleSheet.create({
  aside: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-2'],
  },
  block: { gap: theme.spacing['sp-4'] },
  who: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  whoWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  taskLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  taskPart: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: theme.spacing['sp-1'],
    height: theme.spacing['sp-1'],
    marginHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['text-tertiary'],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing['sp-2'] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-1'],
    paddingHorizontal: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  // Call and Message as equal cells; the tick a circle at the row's end.
  acts: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  act: { flex: 1, flexBasis: 0, minWidth: 0 },
  later: {
    alignItems: 'flex-start',
    paddingTop: theme.spacing['sp-2'],
    borderTopWidth: 1,
    borderTopColor: colors['line-soft'],
  },
});
