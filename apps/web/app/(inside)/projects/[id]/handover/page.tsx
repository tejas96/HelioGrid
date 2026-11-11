import { ProjectHandoverScreen } from '../../../../../features/project-detail';

/** Route entry for /projects/<id>/handover — routing only (`SCR-M08-06`). */
export default async function ProjectHandoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectHandoverScreen key={id} projectId={id} />;
}
