import type { CSSProperties } from 'react';
import { useEffect, useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Button } from '../Button/Button';
import type { NoConnectionProps } from './NoConnection.types';
import { SunCloudMark } from './SunCloudMark';
import { failureSentence, useRetryLifecycle } from './use-retry';

interface WebNoConnectionProps extends NoConnectionProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The one shared full-screen state for "the device has no connection". Not a state on every
 * surface: a surface that fails a fetch shows its own error state, because that is what it is.
 *
 * Three rules are built in:
 * · IT NEVER MENTIONS SYNC. Nothing is queued, nothing uploads later, there is no last-synced
 *   time — the product holds none of that (owner ruling Q61).
 * · RETRY CANNOT LIE (use-retry.ts).
 * · IT DOES NOT BLOCK WHAT STILL WORKS. `children` is the slot for whatever the app CAN show.
 */
export function NoConnection({
  title = "You're not connected",
  message = 'HelioGrid needs a connection to load this. Check your mobile data or Wi-Fi, then try again.',
  onRetry,
  retryLabel = 'Try again',
  failedMessage = 'Still no connection.',
  timeoutMessage = "That's taking too long to answer.",
  retryTimeout = 10000,
  status,
  children,
  animate = true,
  autoFocusRetry = true,
  inset = false,
  className,
  style,
}: WebNoConnectionProps) {
  const headingId = useId();
  const retryRef = useRef<HTMLDivElement>(null);
  const { trying, failure, handleRetry } = useRetryLifecycle(onRetry, retryTimeout, status);

  useEffect(() => {
    if (!autoFocusRetry) {
      return;
    }
    const button = retryRef.current?.querySelector('button');
    button?.focus({ preventScroll: true });
  }, [autoFocusRetry]);

  const sentence = failureSentence(failure, failedMessage, timeoutMessage);

  return (
    <section
      aria-labelledby={headingId}
      data-inset={inset ? 'true' : 'false'}
      className={classNames('hg-no-connection', className)}
      style={style}
    >
      <SunCloudMark animate={animate} />
      <h1 id={headingId} className="hg-no-connection-title">
        {title}
      </h1>
      <p className="hg-no-connection-message">{message}</p>

      <div ref={retryRef} className="hg-no-connection-retry">
        <Button size="lg" loading={trying} onClick={handleRetry}>
          {retryLabel}
        </Button>
      </div>

      {/* The one place the screen is allowed to be specific: what actually happened last time. */}
      <p
        role="status"
        aria-live="polite"
        data-failed={sentence === null ? 'false' : 'true'}
        className="hg-no-connection-outcome"
      >
        {sentence ?? ' '}
      </p>

      {children !== undefined ? <div className="hg-no-connection-children">{children}</div> : null}
    </section>
  );
}
