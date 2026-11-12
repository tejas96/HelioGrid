'use client';
import { useOwnerDashboard, useShell } from '@heliogrid/data/react';
import { MY_DAY_PRESET } from '@heliogrid/domain';
import { ownerDashboardCsv, ownerDashboardWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type NeedOpen, OwnerDashboard, percentOfBasisPoints, useFormat } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { saveTextFile } from '../../../lib/save-text-file';
import {
  DOOR_PATH,
  LEAD_INBOX_PATH,
  leadPath,
  projectPath,
  projectPaymentsPath,
} from '../constants';

/**
 * The owner dashboard on the EPC Owner's and the Sales Manager's home (`SCR-M13-01`): the web's
 * adapters around the one component — each attention item opens its record, the export saves the
 * CSV built from the read already on screen (`M13-52`…`M13-54`).
 */
export function OwnerHome() {
  const t = useTranslate();
  const format = useFormat();
  const board = useOwnerDashboard();
  const shell = useShell();
  const router = useRouter();
  const frame = useRef<HTMLDivElement>(null);
  if (!board.shown) return null;
  const words = ownerDashboardWords(t);
  const onNeed = (open: NeedOpen) => {
    switch (open.kind) {
      case 'unassigned':
        return router.push(LEAD_INBOX_PATH);
      case 'payments_late':
        return router.push(projectPaymentsPath(open.projectId));
      case 'blocked_on_us':
        return router.push(projectPath(open.projectId));
      case 'waiting_longest':
        return router.push(leadPath(open.leadId));
      case 'my_overdue_tasks':
        return shell.homes.includes(MY_DAY_PRESET)
          ? shell.chooseHome(MY_DAY_PRESET)
          : router.push(DOOR_PATH.leads);
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
    saveTextFile(`dashboard-${view.month}.csv`, csv, 'text/csv;charset=utf-8');
  };
  return (
    <div ref={frame} tabIndex={-1} className="hg-focus-target">
      <OwnerDashboard
        read={board.read}
        words={words}
        needsYou={board.needsYou}
        winRate={board.winRate}
        onNeed={onNeed}
        onSetTarget={board.setTarget}
        targetSaving={board.targetSaving}
        targetFailed={board.targetFailed}
        onExport={onExport}
        focusAfter={frame}
      />
    </div>
  );
}
