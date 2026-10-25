import type { FileSubjectKind } from '@heliogrid/domain';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ContractException } from '../../../common/errors/contract-exception';
import type { FileService } from '../../file/file.public';

/** The subject a company's logo is stored against (`FILE_SUBJECT_RULES.tenant`). */
const LOGO: FileSubjectKind = 'tenant';

/** The file service's two ways of saying a file is not a confirmed one of this company and kind. */
function isNoStoredLogo(refusal: unknown): boolean {
  if (!(refusal instanceof HttpException)) return false;
  const status = refusal.getStatus();
  return status === HttpStatus.NOT_FOUND || status === HttpStatus.CONFLICT;
}

/**
 * A logo is this company's own confirmed image or it is refused at its field: a pointer taken on
 * trust would let one company name another's file. Both doors that write the logo — the business
 * profile and branding (`D237`) — ask here. The file service refuses with a 404 (no such file of
 * this company and kind) or a 409 (declared, never stored) — statuses neither route declares — so
 * those two become the shared 400, and anything else is thrown on as it is.
 */
export async function refuseUnlessOwnLogo(
  files: FileService,
  tenantId: string,
  logoFileId: string | null | undefined,
): Promise<void> {
  if (logoFileId === null || logoFileId === undefined) return;
  try {
    await files.confirmed(tenantId, logoFileId, LOGO);
  } catch (refusal) {
    if (!isNoStoredLogo(refusal)) throw refusal;
    throw new ContractException(
      'VALIDATION_FAILED',
      'That file is not a stored logo of this company.',
      HttpStatus.BAD_REQUEST,
      [{ path: 'logoFileId', issue: 'not a stored logo of this company' }],
    );
  }
}
