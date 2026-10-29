/* QRCode (web) — MS9-14 / MS9-24. A scannable code on the proposal link and the proposal document,
   both of which a homeowner sees.

   "Fails visibly rather than silently" is the honesty law stated for this component: if the payload
   can't be encoded, it must NOT render an empty square that looks like a QR which simply won't scan.
   It says the code isn't available and still shows the link, so the customer always has a way
   through.

   The code carries a real accessible name (MS9-24) — a screen reader gets the destination, not
   "image". */

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { darkModules, drawableCode, quietZonedSide, wordsWidth } from './QRCode.logic';
import type { QRCodeProps } from './QRCode.types';

interface WebQRCodeProps extends QRCodeProps {
  className?: string;
  style?: CSSProperties;
}

/** The link text — the fallback path, and what a customer reads out over a phone call. */
function LinkText({ value, width }: { value: string; width: number }) {
  return (
    <code className="hg-qrcode-link" style={{ maxWidth: width }}>
      {value}
    </code>
  );
}

export function QRCode({
  value,
  size = 160,
  label,
  caption,
  quietZone = 4,
  showValue = true,
  errorTitle,
  errorMessage,
  className,
  style,
}: WebQRCodeProps) {
  const result = useMemo(() => drawableCode(value), [value]);

  if (result === null) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: role="group" pairs with <fieldset>, which is a form grouping; this is a failed-code panel, not a form.
      <div
        role="group"
        aria-label={errorTitle}
        className={classNames('hg-qrcode', className)}
        style={style}
      >
        {/* `size` is caller data, not a design value — the only reason a dimension is inline. */}
        <div className="hg-qrcode-failed" style={{ width: size, height: size }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <ShellGlyphMarks name="alert-circle" />
          </svg>
          <span className="hg-qrcode-failed-title">{errorTitle}</span>
        </div>
        <p className="hg-qrcode-note" style={{ maxWidth: wordsWidth(size) }}>
          {errorMessage}
        </p>
        {value && showValue ? <LinkText value={value} width={wordsWidth(size)} /> : null}
      </div>
    );
  }

  const { matrix, size: n } = result;
  const total = quietZonedSide(n, quietZone);

  return (
    <div className={classNames('hg-qrcode', className)} style={style}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${total} ${total}`}
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
        className="hg-qrcode-svg"
      >
        <rect width={total} height={total} className="hg-qrcode-quiet" />
        {darkModules(matrix, quietZone).map((m) => (
          <rect key={m.id} x={m.x} y={m.y} width={1} height={1} className="hg-qrcode-module" />
        ))}
      </svg>
      {caption ? <p className="hg-qrcode-caption">{caption}</p> : null}
      {showValue ? <LinkText value={value} width={wordsWidth(size)} /> : null}
    </div>
  );
}
