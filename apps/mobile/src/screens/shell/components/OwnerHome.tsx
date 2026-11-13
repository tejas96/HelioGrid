import { useOwnerDashboard, useShell } from '@heliogrid/data/react';
import { MY_DAY_PRESET } from '@heliogrid/domain';
import { ownerDashboardCsv, ownerDashboardWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type NeedOpen, OwnerDashboard, percentOfBasisPoints, useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { Share, View } from 'react-native';
import { doorRoute } from '../doors';

/**
 * The owner dashboard on the EPC Owner's and the Sales Manager's home (`SCR-M13-01`): the phone's
 * adapters around the one component — each attention item opens its record, and the export hands
 * the CSV built from the read already on screen to the share sheet (`M13-52`…`M13-54`).
 */
export function OwnerHome() {
  const t = useTranslate();
  const format = useFormat();
  const navigation = useNavigation();
  const board = useOwnerDashboard();
  const shell = useShell();
  const frame = useRef<View>(null);
  if (!board.shown) return null;
  const words = ownerDashboardWords(t);
  const onNeed = (open: NeedOpen) => {
    switch (open.kind) {
      case 'assign_waiting':
        return board.assignWaiting();
      case 'unassigned':
        return navigation.navigate('LeadInbox');
      case 'payments_late':
        return navigation.navigate('ProjectPayments', { projectId: open.projectId });
      case 'blocked_on_us':
        return navigation.navigate('ProjectDetail', { projectId: open.projectId });
      case 'waiting_longest':
        return navigation.navigate('LeadDetail', { leadId: open.leadId });
      case 'my_overdue_tasks':
        return shell.homes.includes(MY_DAY_PRESET)
          ? shell.chooseHome(MY_DAY_PRESET)
          : navigation.navigate(doorRoute.leads);
    }
  };
  const onExport = () => {
    if (board.read.kind !== 'ready' || board.winRate === null) return;
    const view = board.read.value;
    const csv = ownerDashboardCsv(t, view, board.winRate, {
      money: format.money,
      percent: (basisPoints) => percentOfBasisPoints(basisPoints, words, format),
      day: format.date,
    });
    void Share.share({ message: csv, title: words.export }).catch(() => undefined);
  };
  return (
    <View ref={frame}>
      <OwnerDashboard
        read={board.read}
        words={words}
        needsYou={board.needsYou}
        winRate={board.winRate}
        onNeed={onNeed}
        onSetTarget={board.setTarget}
        targetSaving={board.targetSaving}
        targetFailed={board.targetFailed}
        assigning={board.assigning}
        assignFailed={board.assignFailed}
        onExport={onExport}
        focusAfter={frame}
      />
    </View>
  );
}
