import { ProjectDetailScreen } from '../../../../../features/project-detail';

/** Route entry for /projects/<id>/documents — routing only (`SCR-M08-03`). */
export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailScreen key={id} projectId={id} documents="all" ask={null} />;
}
