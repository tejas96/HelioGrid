import { type DeclaredFile, type FileDownload, OBJECT_STORE } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MemoryObjectStore } from '../../src/modules/file/internal/object-store.memory';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';
import { declarationOf, pngOf } from './support';

/**
 * A stored file is its company's alone (`T-FPLAT-035` C2, D2), on the WIRE: the guard, the tenant
 * pin and RLS together, which the service alone proves none of. One person holds two companies;
 * under the second, the first's file does not exist.
 */
/** A small logo's size in bytes; its exact value matters to no case here. */
const A_LOGO = 128;

const skip = skipWithoutHarness(
  'FILE TENANCY WIRE PROOF',
  'A file read across companies is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('a stored file across companies, over HTTP', () => {
  let http: Http;
  let fileId: string;

  beforeAll(async () => {
    http = await bootHttp();
    await http.signIn();
    const first = await http.createCompany('Files First EPC');
    const tenantId = first.membership?.tenantId ?? '';
    const bytes = pngOf(A_LOGO);
    const declared = await http.call<DeclaredFile>(
      'POST',
      '/files',
      declarationOf(tenantId, bytes),
    );
    expect(declared.status).toBe(HttpStatus.CREATED);
    fileId = declared.body.file.id;
    const store = http.app.get<MemoryObjectStore>(OBJECT_STORE);
    expect(store).toBeInstanceOf(MemoryObjectStore);
    expect(store.receive(declared.body.upload?.url ?? '', bytes)).toBe(true);
    const done = await http.call('POST', `/files/${fileId}/complete`);
    expect(done.status).toBe(HttpStatus.OK);
    const own = await http.call<FileDownload>('GET', `/files/${fileId}/download-url`);
    expect(own.status).toBe(HttpStatus.OK);
    await http.createCompany('Files Second EPC');
  });

  afterAll(async () => {
    await http.close();
  });

  it("another company's file is not found and gets no link", async () => {
    const read = await http.call<FileDownload>('GET', `/files/${fileId}/download-url`);
    expect(read.status).toBe(HttpStatus.NOT_FOUND);
    expect(JSON.stringify(read.body)).not.toContain('memory://');
    const completed = await http.call('POST', `/files/${fileId}/complete`);
    expect(completed.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('refuses every file route without a session', async () => {
    const replies = await Promise.all([
      http.callAnonymously('POST', '/files', {}),
      http.callAnonymously('POST', `/files/${fileId}/complete`),
      http.callAnonymously('GET', `/files/${fileId}/download-url`),
    ]);
    expect(replies.map((reply) => reply.status)).toEqual([
      HttpStatus.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    ]);
  });
});
