/**
 * Sun behind a slowly drifting cloud. Circles and pills only — no drawn artwork.
 *
 * It is the one piece of charm in the system and the only screen that earns it: everything else in
 * HelioGrid is a precision instrument, and this is the screen a surveyor is staring at on a roof.
 * It holds still under `prefers-reduced-motion` (NoConnection.css).
 */
export function SunCloudMark({ animate = true }: { animate?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="hg-no-connection-mark"
      data-animate={animate ? 'true' : 'false'}
    >
      <span className="hg-no-connection-glow" />
      <span className="hg-no-connection-sun" />
      <span className="hg-no-connection-cloud">
        <span className="hg-no-connection-cloud-base" />
        <span className="hg-no-connection-cloud-lobe-a" />
        <span className="hg-no-connection-cloud-lobe-b" />
      </span>
    </div>
  );
}
