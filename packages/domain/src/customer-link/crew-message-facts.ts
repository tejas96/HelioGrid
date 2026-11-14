/** What the evening-before crew message needs before it can be composed (`F5-68`). */
export const CREW_MESSAGE_FACTS = ['start_time', 'duration', 'crew_lead', 'crew'] as const;
export type CrewMessageFact = (typeof CREW_MESSAGE_FACTS)[number];

/** The installation day as a project's read carries it — `installationFactsSchema`, by shape. */
interface InstallationDay {
  readonly startTime: string | null;
  readonly durationDays: number | null;
  readonly crewLead: unknown;
}

/**
 * The facts the crew message still lacks: it tells the customer who is coming, when and for how
 * long, so a message with any of them missing is not offered — a person adds them first. What to
 * expect is optional: a quiet job has nothing to warn about.
 */
export function crewMessageMissing(
  day: InstallationDay | undefined,
  crewCount: number,
): readonly CrewMessageFact[] {
  const missing: CrewMessageFact[] = [];
  if (day?.startTime == null) missing.push('start_time');
  if (day?.durationDays == null) missing.push('duration');
  if (day?.crewLead == null) missing.push('crew_lead');
  if (crewCount === 0) missing.push('crew');
  return missing;
}
