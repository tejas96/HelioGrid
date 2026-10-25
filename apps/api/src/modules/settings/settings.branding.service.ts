import type { BrandingRead, BrandingSave } from '@heliogrid/contracts';
import { compliantShades } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { FileService } from '../file/file.public';
import { refuseUnlessOwnLogo } from './internal/own-logo';
import { SettingsBrandingRepository } from './settings.branding.repository';
import { SettingsService } from './settings.service';

/**
 * The Branding page (`M01-50`, `SCR-M01-18`): the branding in force with its derived shades, the
 * profile's logo beside it, and who saved it last — and the one save that writes all three. The
 * colour is never refused (`F7-07`); it is stored as the derivation normalises it, and the shades
 * are derived on every read, never stored.
 */
@Injectable()
export class SettingsBrandingService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsBrandingRepository) private readonly rows: SettingsBrandingRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(FileService) private readonly files: FileService,
  ) {}

  async read(tenantId: string): Promise<BrandingRead> {
    const [{ branding }, { logoFileId, changed }] = await Promise.all([
      this.settings.effective(tenantId),
      this.rows.facts(tenantId),
    ]);
    return {
      ...branding.value,
      logoFileId,
      changed: changed === null ? null : { at: changed.at.toISOString(), by: changed.by },
    };
  }

  /** A logo that is not this company's stored image is refused at its field before anything is written. */
  async save(tenantId: string, body: BrandingSave, act: Act): Promise<BrandingRead> {
    await refuseUnlessOwnLogo(this.files, tenantId, body.logoFileId);
    const brandColour = body.brandColour === null ? null : compliantShades(body.brandColour).brand;
    await this.rows.save(
      tenantId,
      { brandColour, letterhead: body.letterhead, logoFileId: body.logoFileId },
      act,
    );
    return this.read(tenantId);
  }
}
