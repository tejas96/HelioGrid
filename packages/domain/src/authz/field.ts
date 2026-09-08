import {
  type CapabilityRow,
  DENIED,
  GRANTED,
  limited,
  none,
  scope,
  through,
  type VisibilityDomain,
  type VisibilityRow,
} from './cells';

/**
 * F2 §F2.5-M09 — Field workforce. Every cell is the PRD's, and
 * `tests/authz/matrix-mirrors-f2.test.ts` holds them equal; a placeholder row of this module is
 * appended HERE by its first slice (Law 9), never typed into a screen or a handler.
 */
export const FIELD_ROWS = {
  // Check in and out of a site, and log a visit and its outcome
  'field.check_in_out': {
    rowKey: 'F2.M09.check-in-out',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
      design_engineer: DENIED,
      project_manager: GRANTED,
      field_technician: GRANTED,
      installation_team_member: GRANTED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // Mark one's **own** day start and day end
  'field.mark_attendance': {
    rowKey: 'F2.M09.mark-attendance',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: GRANTED,
      survey_engineer: GRANTED,
      design_engineer: GRANTED,
      project_manager: GRANTED,
      field_technician: GRANTED,
      installation_team_member: GRANTED,
      hr_admin: GRANTED,
      finance: GRANTED,
      operations: GRANTED,
      marketing: GRANTED,
    },
  },
  // Read **others'** attendance records (the attendance slice only)
  'field.attendance_visibility': {
    rowKey: 'F2.M09.attendance-visibility',
    grants: {
      epc_owner: limited('All'),
      sales_manager: limited('Team'),
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: limited("Own projects' field workers"),
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: limited('All'),
      finance: DENIED,
      operations: limited('Team'),
      marketing: DENIED,
    },
  },
  // Turn per-employee field tracking on or off (a commercial commitment and a privacy decision)
  'field.toggle_tracked_seat': {
    rowKey: 'F2.M09.toggle-tracked-seat',
    grants: {
      epc_owner: GRANTED,
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: DENIED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: DENIED,
      marketing: DENIED,
    },
  },
  // Define a site's geofence and adjust its radius
  'field.manage_geofences': {
    rowKey: 'F2.M09.manage-geofences',
    grants: {
      epc_owner: GRANTED,
      sales_manager: GRANTED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: GRANTED,
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: GRANTED,
      marketing: DENIED,
    },
  },
  // See **another person's** live position, route timeline, movement history and day playback (tracked seats only)
  'field.view_live_location': {
    rowKey: 'F2.M09.view-live-location',
    grants: {
      epc_owner: limited('All'),
      sales_manager: DENIED,
      sales_executive: DENIED,
      survey_engineer: DENIED,
      design_engineer: DENIED,
      project_manager: limited("Own projects' field work"),
      field_technician: DENIED,
      installation_team_member: DENIED,
      hr_admin: DENIED,
      finance: DENIED,
      operations: limited('Team'),
      marketing: DENIED,
    },
  },
} as const satisfies Record<string, CapabilityRow>;

export const FIELD_VISIBILITY = {
  // Field-work visibility scope (the `F2-14` **field work** domain as cells)
  field_work: {
    rowKey: 'F2.M09.field-visibility',
    cells: {
      epc_owner: scope('all'),
      sales_manager: none,
      sales_executive: none,
      survey_engineer: scope('own'),
      design_engineer: none,
      project_manager: through('projects', 'own', "projects' field work"),
      field_technician: scope('own'),
      installation_team_member: scope('own'),
      hr_admin: none,
      finance: none,
      operations: scope('team'),
      marketing: none,
    },
  },
} as const satisfies Partial<Record<VisibilityDomain, VisibilityRow>>;
