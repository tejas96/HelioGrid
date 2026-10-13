import { DOOR_PATH } from '../shell';

/** A settings row's address: under the door that opens the list (`M01-61`, `SETTINGS_SEGMENT`). */
export const settingsRowPath = (segment: string): string => `${DOOR_PATH.more}/${segment}`;
