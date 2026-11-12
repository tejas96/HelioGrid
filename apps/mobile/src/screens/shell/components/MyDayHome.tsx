import { type MyDayAct, useMyDay } from '@heliogrid/data/react';
import { myDayToastWords, myDayWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { MyDay } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { OneToast } from '../../shared/OneToast';
import { dial, openDirections } from '../../shared/open-outside';

/**
 * The sales executive's My Day on their home (`SCR-M07-01`): the phone's adapters around the one
 * component — the dialler, the maps, the lead's page — and the act's toast with *Undo* above the
 * pill. Drawn only when the home holds My Day.
 */
export function MyDayHome() {
  const t = useTranslate();
  const navigation = useNavigation();
  const day = useMyDay();
  const frame = useRef<View>(null);
  if (!day.shown) return null;
  const words = myDayWords(t);
  const toast = myDayToastWords(t);
  const line = (act: MyDayAct) => {
    const name = act.item.lead.name ?? words.unnamed;
    return {
      tone: 'success' as const,
      title: act.kind === 'done' ? toast.done(name) : toast.moved(name),
      undo: { label: toast.undo, onUndo: day.undo },
    };
  };
  const openLead = (leadId: string) => navigation.navigate('LeadDetail', { leadId });
  return (
    <View ref={frame}>
      <MyDay
        read={day.read}
        words={words}
        next={day.next}
        bands={day.bands}
        onExpand={day.expand}
        onOpen={(item) => openLead(item.lead.id)}
        onCall={(item) => {
          dial(item.lead.phoneE164);
          day.called(item);
        }}
        onMessage={(item) => openLead(item.lead.id)}
        onDirections={(item) => {
          if (item.visitPlace !== null) openDirections(item.visitPlace);
        }}
        onDone={day.done}
        onMoveToTomorrow={day.moveToTomorrow}
        asking={day.asking}
        onAnswer={day.answer}
        onSkipAnswer={day.skipAnswer}
        sending={day.sending}
        failed={day.failed}
        focusAfter={frame}
      />
      <OneToast fact={day.lastAct} line={line} onDismiss={day.dismissAct} focusAfter={frame} />
    </View>
  );
}
