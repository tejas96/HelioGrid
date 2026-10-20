'use client';
import { roleKind, type TeamRow } from '@heliogrid/domain';
import { TEAM, type TeamListWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Badge,
  DataTable,
  type DataTableColumn,
  MemberPerson,
  ROLE_KIND_TONE,
  TEAM_STATUS_TONE,
} from '@heliogrid/ui';

interface TeamTableProps {
  rows: readonly TeamRow[];
  words: TeamListWords;
  loading?: boolean;
}

/**
 * The team at the table's width (`SCR-M01-12`, `d-default`): Person (the face, the name, *You* and
 * the status), Roles and Last active, in the owner's 2.2 : 2.4 : 1.2, on `DataTable`'s quiet head
 * (design-system change 20). The row act's column lands with the acts (`T-M01-012c`).
 */
export function TeamTable({ rows, words, loading = false }: TeamTableProps) {
  const t = useTranslate();
  const columns: DataTableColumn<TeamRow>[] = [
    {
      key: 'person',
      label: t(TEAM.person),
      primary: true,
      width: '38%',
      render: (row) => (
        <MemberPerson
          name={row.name}
          {...(row.isViewer ? { youLabel: words.you } : {})}
          status={words.row(row).status}
          tone={TEAM_STATUS_TONE[row.status]}
        />
      ),
    },
    {
      key: 'roles',
      label: t(TEAM.roles),
      width: '41%',
      wrap: true,
      render: (row) => (
        <div className="hg-team-roles">
          {row.roles.map((preset) => (
            <Badge key={preset} tone={ROLE_KIND_TONE[roleKind(preset)]} density="functional">
              {words.role(preset)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'last-active',
      label: t(TEAM.lastActive),
      width: '21%',
      muted: true,
      render: (row) => words.row(row).lastActive,
    },
  ];
  return (
    <DataTable
      head="quiet"
      caption={words.label}
      columns={columns}
      rows={[...rows]}
      rowKey="id"
      state={loading ? 'loading' : 'ready'}
      stackBelow={0}
    />
  );
}
