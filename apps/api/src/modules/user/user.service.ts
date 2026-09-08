import type { UpdateUserProfile, UserProfile } from '@heliogrid/contracts';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserAdminRepository } from './user.admin.repository';

@Injectable()
export class UserService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(UserAdminRepository) private readonly accounts: UserAdminRepository) {}

  async updateMe(userId: string, patch: UpdateUserProfile): Promise<UserProfile> {
    // An empty patch is a read: an UPDATE with nothing to set is a query error, not a no-op.
    const row =
      Object.keys(patch).length === 0
        ? await this.accounts.byId(userId)
        : await this.accounts.update(userId, patch);
    if (row === null) throw new NotFoundException('This account no longer exists.');
    return { ...row, name: row.name ?? '' };
  }
}
