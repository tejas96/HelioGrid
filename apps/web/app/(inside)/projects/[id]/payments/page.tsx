import { ProjectPaymentsScreen } from '../../../../../features/project-detail';

/** Route entry for /projects/<id>/payments — routing only (`SCR-M11-02`). */
export default async function ProjectPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectPaymentsScreen key={id} projectId={id} />;
}
