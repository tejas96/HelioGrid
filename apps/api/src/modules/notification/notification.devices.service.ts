import type { RegisterDevice } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PushDeviceAdminRepository } from './notification.devices.admin.repository';

/**
 * A handset registering itself, and letting go (`F6-06`, `F6-13`).
 *
 * Both are the caller's OWN device: the token is bound to the person the session names, never to
 * one the request chose. Registering the same token twice replaces the row, so signing in again
 * collects no duplicates and nobody is pushed twice for one notification; forgetting a token
 * that is already gone is success, because a sign-out should not fail on a race with itself.
 */
@Injectable()
export class NotificationDevicesService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PushDeviceAdminRepository) private readonly devices: PushDeviceAdminRepository,
  ) {}

  async register(userRef: string, device: RegisterDevice, now: Date): Promise<void> {
    await this.devices.register(userRef, device.platform, device.token, now);
  }

  async forget(token: string): Promise<void> {
    await this.devices.forget(token);
  }
}
