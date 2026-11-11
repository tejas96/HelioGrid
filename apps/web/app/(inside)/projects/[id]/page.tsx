import { ProjectDetailScreen } from '../../../../features/project-detail';
import { EARLY_PROOF_ASK } from '../../../../features/shell';

/**
 * Route entry for /projects/<id> — routing only; the shell is this group's layout (`SCR-M08-02`).
 * `?ask=early-proof` opens it asking about its early proof (the board's *To do*).
 */
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ask?: string }>;
}) {
  const { id } = await params;
  const { ask } = await searchParams;
  // A second project keeps this page mounted with new params: keyed by the id, it starts afresh.
  return (
    <ProjectDetailScreen
      key={id}
      projectId={id}
      documents="waiting"
      ask={ask === EARLY_PROOF_ASK ? 'earlyProof' : null}
    />
  );
}
