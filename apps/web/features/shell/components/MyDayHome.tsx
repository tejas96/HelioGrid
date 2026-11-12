'use client';
import { useMyDay } from '@heliogrid/data/react';
import { myDayToastWords, myDayWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { MyDay } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { OneToast } from '../../../lib/one-toast';
import { openDirections } from '../../../lib/open-external';
import { leadPath } from '../constants';

/**
 * The sales executive's My Day on their home (`SCR-M07-01`): the web's adapters around the one
 * component — a call through the device's dialler, a visit's place in the maps, the lead's page —
 * and the act's toast, with *Undo* after a tick or a move. Drawn only when the home holds My Day.
 */
export function MyDayHome() {
  const t = useTranslate();
  const day = useMyDay();
  const router = useRouter();
  const frame = useRef<HTMLDivElement>(null);
  if (!day.shown) return null;
  const words = myDayWords(t);
  const toast = myDayToastWords(t);
  return (
    <div ref={frame} tabIndex={-1} className="hg-focus-target">
      <MyDay
        read={day.read}
        words={words}
        next={day.next}
        bands={day.bands}
        onExpand={day.expand}
        onOpen={(item) => router.push(leadPath(item.lead.id))}
        onCall={(item) => {
          window.location.assign(`tel:${item.lead.phoneE164}`);
          day.called(item);
        }}
        onMessage={(item) => router.push(leadPath(item.lead.id))}
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
      <OneToast
        fact={day.lastAct}
        line={(act) => toast.line(act, day.undo)}
        onDismiss={day.dismissAct}
        focusAfter={frame}
      />
    </div>
  );
}
