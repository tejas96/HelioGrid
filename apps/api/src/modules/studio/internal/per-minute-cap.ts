/** A minute, the window a person's asks are counted in. */
const MINUTE_MS = 60_000;

/**
 * How many billed asks one person may start in a minute (the sky picture, the site's height data):
 * a reload loop is capped, and past the cap the studio says the source did not answer. Held in
 * memory only, per api process.
 */
export class PerMinuteCap {
  private readonly asked = new Map<string, number[]>();

  constructor(private readonly limit: number) {}

  /** Whether the person may ask once more now; counts the ask when they may. */
  take(userId: string, now: number): boolean {
    const recent = (this.asked.get(userId) ?? []).filter((at) => now - at < MINUTE_MS);
    if (recent.length >= this.limit) {
      this.asked.set(userId, recent);
      return false;
    }
    this.asked.set(userId, [...recent, now]);
    return true;
  }
}
