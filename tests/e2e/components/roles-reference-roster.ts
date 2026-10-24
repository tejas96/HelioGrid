import { ROLE_PRESETS, type RolePreset, type TeamRow } from '@heliogrid/domain';

/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
const [OWNER, , SALES, SURVEY, DESIGN, PROJECT, , INSTALL] = ROLE_PRESETS;

const person = (name: string, status: TeamRow['status'], roles: RolePreset[]): TeamRow => ({
  id: name,
  name,
  phoneE164: '+919876543210',
  roles,
  status,
  isViewer: false,
  lastActiveAt: null,
  expiresAt: null,
  inviteDay: null,
});

/** The board's roster (`holderSpec`): six roles held by nobody, one open invite, one let go. */
export const BOARD_ROSTER: readonly TeamRow[] = [
  person('Priya Deshmukh', 'invited', [SALES]),
  person('Amit Rane', 'active', [SALES, SURVEY]),
  person('Anjali Kulkarni', 'active', [SALES]),
  person('Kavita Shirke', 'active', [SURVEY]),
  person('Meera Iyer', 'active', [DESIGN]),
  person('Nitin Pawar', 'active', [PROJECT]),
  person('Rajesh Kulkarni', 'active', [OWNER]),
  person('Sunil Bhosale', 'active', [INSTALL]),
  person('Vikram Deshpande', 'active', [SURVEY, DESIGN, INSTALL]),
  person('Deepak Jadhav', 'deactivated', [INSTALL]),
];
