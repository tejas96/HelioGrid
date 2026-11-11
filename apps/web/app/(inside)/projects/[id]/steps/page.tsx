import { ProjectStepsScreen } from '../../../../../features/project-detail';

/** Route entry for /projects/<id>/steps — routing only (`SCR-M08-04`). */
export default async function ProjectStepsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectStepsScreen key={id} projectId={id} />;
}
