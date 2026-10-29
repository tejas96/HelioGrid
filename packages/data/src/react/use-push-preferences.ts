'use client';
import type { NotificationPreference } from '@heliogrid/contracts';
import {
  mapRead,
  type NotificationTypeGroup,
  type PushSwitch,
  pushSwitches,
  type Read,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { useSession } from './use-session';

/** The person's push switches on Profile & preferences (`F6-15`), as both platforms render them. */
export interface PushPreferences {
  /**
   * One switch per group shown, a tap still on its way already applied (brief decision 2); the
   * page draws its loading or error frame until the rows arrive.
   */
  readonly read: Read<readonly PushSwitch[]>;
  /** The groups whose last write was refused: each shows *Not saved* on its own switch (D219). */
  readonly refused: readonly NotificationTypeGroup[];
  /** A switch was tapped: push for that group flips, applied as it is touched. */
  flip(group: NotificationTypeGroup): void;
}

/**
 * A group's writes go one after another, so two fast taps reach the server in the order they were
 * made and the last tap is the last write (AC-12). A tap flips from the last value tapped, held in
 * a ref, never from the switch's drawn value: a second tap can land before the screen redraws, and
 * would ask for the same value twice. Until a group's last write answers, the page shows what was
 * tapped; then it shows what the server holds, and a refusal marks the switch.
 */
export function usePushPreferences(): PushPreferences {
  const { user, ended } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const repositories = useRepositories();
  const cache = useQueryClient();
  const key = queryKeys.pushPreferences(tenantId);
  const preferences = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.notification.preferences(signal),
    enabled: tenantId !== '' && ended === null,
  });
  /** Each group's last tap still on its way, `true` is push on: `pending` now, `tapped` as drawn. */
  const pending = useRef(new Map<NotificationTypeGroup, boolean>());
  const [tapped, setTapped] = useState<Partial<Record<NotificationTypeGroup, boolean>>>({});
  const [refused, setRefused] = useState<readonly NotificationTypeGroup[]>([]);
  const queues = useRef(new Map<NotificationTypeGroup, Promise<void>>());
  const lastTap = useRef(new Map<NotificationTypeGroup, number>());

  const settle = (group: NotificationTypeGroup, failed: boolean) => {
    pending.current.delete(group);
    setTapped(({ [group]: _, ...rest }) => rest);
    if (failed) setRefused((held) => [...held.filter((one) => one !== group), group]);
  };

  const write = async (group: NotificationTypeGroup, pushMuted: boolean, tap: number) => {
    let failed = false;
    try {
      /* A read already out could answer after this write and put the older row back. */
      await cache.cancelQueries({ queryKey: key });
      const stored = await repositories.notification.setPreference(group, pushMuted);
      cache.setQueryData<readonly NotificationPreference[]>(key, (held) =>
        held?.map((row) => (row.group === group ? stored : row)),
      );
    } catch {
      failed = true;
    }
    if (lastTap.current.get(group) === tap) settle(group, failed);
  };

  const isOn = (group: NotificationTypeGroup) =>
    pending.current.get(group) ??
    !cache.getQueryData<readonly NotificationPreference[]>(key)?.find((row) => row.group === group)
      ?.pushMuted;

  const flip = (group: NotificationTypeGroup) => {
    const on = !isOn(group);
    const tap = (lastTap.current.get(group) ?? 0) + 1;
    lastTap.current.set(group, tap);
    pending.current.set(group, on);
    setTapped((held) => ({ ...held, [group]: on }));
    setRefused((held) => held.filter((one) => one !== group));
    const queued = queues.current.get(group) ?? Promise.resolve();
    queues.current.set(
      group,
      queued.then(() => write(group, !on, tap)),
    );
  };

  return {
    read: mapRead(readOf(preferences), (stored) =>
      pushSwitches(stored, user?.tenant?.roles ?? []).map((one) => {
        const on = tapped[one.group];
        return on === undefined || one.locked ? one : { ...one, on };
      }),
    ),
    refused,
    flip,
  };
}
