'use client';
import type { Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import type { ProjectsRepository } from '../projects/projects-repository';
import { useRepositories } from './context';
import { readOf } from './read';
import { useTenantId } from './use-tenant-id';

type ProjectPeople = Awaited<ReturnType<ProjectsRepository['people']>>;

/**
 * Who a project sheet picks from (rulings 6 and 12): the project managers and the owner for a
 * manager, the installation team for a crew — read only while a sheet that picks is open (`role`).
 */
export function useProjectPeople(role: 'manager' | 'crew' | null): Read<ProjectPeople> {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const people = useQuery({
    queryKey: queryKeys.projects.people(tenantId, role ?? 'manager'),
    queryFn: ({ signal }) => repositories.projects.people(role ?? 'manager', signal),
    enabled: tenantId !== '' && role !== null,
  });
  return readOf(people, (value) => value.length === 0);
}
