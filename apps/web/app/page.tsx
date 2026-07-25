import Link from 'next/link';

/** Scaffold landing — real flows land with their tracks; /design is the living token reference. */
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <section className="hg-card w-full max-w-md">
        <p className="hg-overline">HelioGrid</p>
        <h1 className="hg-h1">Foundations ready</h1>
        <p className="hg-muted">CRM, surveys, 3D design and proposals for solar EPCs.</p>
        <Link href="/design" className="hg-btn-primary">
          Open the design reference
        </Link>
      </section>
    </main>
  );
}
