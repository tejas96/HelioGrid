'use client';
import type { CatalogImportWire } from '@heliogrid/contracts';
import {
  CATALOG_IMPORT_COLUMNS,
  CATALOG_IMPORT_FIELDS,
  type CatalogImportCounts,
  type CatalogImportEntryPoint,
  type CatalogImportField,
  type ImportContinueGate,
  type ImportWizardFrame,
  importContinueGate,
} from '@heliogrid/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import type { ChosenSpreadsheet, ImportActFailure, ImportUpload } from './import-job-facts';
import { useImportJob } from './use-import-job';
import { useTenantId } from './use-tenant-id';

/**
 * One catalog import, from a chosen file to its report (`SCR-M01-17`, `M01-41`): the shared import
 * job (`useImportJob`) over the catalog's routes, fields and guess. A start or a run reads the kept
 * reports again; a completed run reads the whole catalog again, since it wrote prices.
 */
export function useCatalogImport(entryPoint: CatalogImportEntryPoint) {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const keptAgain = () =>
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.imports(tenantId) });
  const job = useImportJob<CatalogImportWire, CatalogImportField>({
    subjectKind: 'catalog',
    fields: CATALOG_IMPORT_FIELDS,
    columns: CATALOG_IMPORT_COLUMNS,
    jobKey: queryKeys.catalog.import,
    read: (id, signal) => repositories.catalogImport.job(id, signal),
    start: async (file) => {
      const next = await repositories.catalogImport.start({ ...file, entryPoint });
      keptAgain();
      return next;
    },
    map: (id, mapping) => repositories.catalogImport.map(id, mapping),
    run: async (id) => {
      const next = await repositories.catalogImport.run(id);
      keptAgain();
      return next;
    },
  });
  // A completed run wrote prices: the whole catalog reads again.
  const completed = job.status === 'completed';
  useEffect(() => {
    if (completed)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.all(tenantId),
        // The finished job itself is read as it stands; its row lists and the catalog read again.
        predicate: (query) => !(query.queryKey[2] === 'import' && query.queryKey.length === 4),
      });
  }, [completed, queryClient, tenantId]);

  return {
    ...job,
    gate: importContinueGate(
      job.frame,
      job.draft?.columns ?? [],
    ) satisfies ImportContinueGate | null,
    /** A fix's answer: the job's counts as they now stand. */
    takeCounts(counts: CatalogImportCounts) {
      if (job.job !== null) job.settle({ ...job.job, counts });
    },
  };
}

export type CatalogImport = ReturnType<typeof useCatalogImport>;
export type { ChosenSpreadsheet, ImportActFailure, ImportUpload, ImportWizardFrame };
