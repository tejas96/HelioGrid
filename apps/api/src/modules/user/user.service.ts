import type { MyPhoto, UpdateUserProfile, UserProfile } from '@heliogrid/contracts';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { FileService } from '../file/file.public';
import { UserAdminRepository } from './user.admin.repository';
import { UserPhotoRepository } from './user.photo.repository';

@Injectable()
export class UserService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(UserAdminRepository) private readonly accounts: UserAdminRepository,
    @Inject(UserPhotoRepository) private readonly photos: UserPhotoRepository,
    @Inject(FileService) private readonly files: FileService,
  ) {}

  async updateMe(userId: string, patch: UpdateUserProfile): Promise<UserProfile> {
    // An empty patch is a read: an UPDATE with nothing to set is a query error, not a no-op.
    const row =
      Object.keys(patch).length === 0
        ? await this.accounts.byId(userId)
        : await this.accounts.update(userId, patch);
    if (row === null) throw new NotFoundException('This account no longer exists.');
    return { ...row, name: row.name ?? '' };
  }

  async myPhoto(tenantId: string, userId: string): Promise<MyPhoto> {
    return { photoFileId: await this.photos.find(tenantId, userId) };
  }

  /**
   * My photo in this company is a confirmed file of this company, stored against my own account:
   * `confirmedOwn` answers 404 for another company's file, another kind or a teammate's photo, and
   * 409 for one never stored — a pointer taken on trust would let one person wear another's face.
   */
  async setMyPhoto(tenantId: string, fileId: string | null, act: Act): Promise<MyPhoto> {
    if (fileId !== null) await this.files.confirmedOwn(tenantId, fileId, 'user_account', act);
    const photoFileId = await this.photos.set(tenantId, act.actorUserId, fileId, act.now);
    return { photoFileId };
  }
}
