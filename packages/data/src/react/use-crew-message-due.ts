'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useTenantId } from './use-tenant-id';

/** Whether the project's evening-before message is due (`F5-68`); false until a project exists. */
export function useCrewMessageDue(projectId: string): boolean {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const project = useQuery({
    queryKey: queryKeys.projects.detail(tenantId, projectId),
    queryFn: ({ signal }) => repositories.projects.detail(projectId, signal),
    enabled: tenantId !== '' && projectId !== '',
  });
  return project.data?.crewMessageDue === true;
}
