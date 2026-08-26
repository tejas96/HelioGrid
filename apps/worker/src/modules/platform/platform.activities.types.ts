/**
 * The activity SIGNATURES, and nothing else.
 *
 * It exists so `platform.workflows.ts` can be typed against the activities without importing
 * their implementations: the workflow bundle is built from the workflow file's import graph,
 * and importing the implementation would pull the database driver into a sandbox that must
 * not have one. A types-only file has no runtime graph at all.
 */
export interface PlatformActivities {
  recordHeartbeat(eventId: string, beat: number): Promise<{ key: string; at: string }>;
}
