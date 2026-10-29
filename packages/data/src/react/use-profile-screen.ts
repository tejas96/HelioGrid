'use client';
import {
  type MeasurementSystem,
  type ProfilePreference,
  type ProfilePreferencesView,
  profilePreferencesView,
  type SavedPhoto,
  type SessionUser,
  type UiLanguage,
} from '@heliogrid/domain';
import { useState } from 'react';
import { useMyPhoto } from './use-my-photo';
import { type NameAndPhotoEditor, useNameAndPhotoEditor } from './use-name-and-photo-editor';
import { type PushPreferences, usePushPreferences } from './use-push-preferences';
import { type RoleCardRead, useRoleCard } from './use-role-card';
import { useSession } from './use-session';

/** The role card as both Profile screens open it over the page. */
export interface ProfileRoleCard extends RoleCardRead {
  readonly isOpen: boolean;
  /** Reads the card again, so it never shows a stale grant, and opens it. */
  open(): void;
  close(): void;
}

/**
 * Profile & preferences (`SCR-M01-11`) as both screens draw it, assembled once (Law 11, `F7-30`):
 * the person, the preferences and where each came from, the push switches, the photo, the name and
 * photo editor and the role card.
 */
export interface ProfileScreen {
  readonly user: SessionUser;
  readonly view: ProfilePreferencesView;
  /** The preferences whose last save was refused; each shows on the control that made it (D219). */
  readonly refused: readonly ProfilePreference[];
  readonly push: PushPreferences;
  readonly photo: SavedPhoto;
  readonly editor: NameAndPhotoEditor;
  readonly role: ProfileRoleCard;
  /** Opens the name and photo editor on the name and photo as saved. */
  editName(): void;
  chooseUnits(next: MeasurementSystem): void;
}

/**
 * Fills `ProfileScreen`, or null while no one is signed in. What only the screen's packages know is
 * its input: the device's first language (`useI18n().device`) and the market's units
 * (`pack.measurementSystem`). A language applies through the i18n provider, which saves it.
 */
export function useProfileScreen(
  device: UiLanguage | null,
  marketUnits: MeasurementSystem,
): ProfileScreen | null {
  const { user, refusedPreferences, setUnitPreference } = useSession();
  const push = usePushPreferences();
  const photo = useMyPhoto();
  const editor = useNameAndPhotoEditor();
  const card = useRoleCard();
  const [roleOpen, setRoleOpen] = useState(false);
  if (user === null) return null;
  return {
    user,
    view: profilePreferencesView({ user, device, marketUnits }),
    refused: refusedPreferences,
    push,
    photo,
    editor,
    role: {
      ...card,
      isOpen: roleOpen,
      open: () => {
        card.refresh();
        setRoleOpen(true);
      },
      close: () => setRoleOpen(false),
    },
    editName: () => editor.open(user.name, photo),
    chooseUnits: (next) => void setUnitPreference(next),
  };
}
