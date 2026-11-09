import { useEffect, useRef } from 'react';
import { Text } from '../../primitives/Text';
import { DIGITS, figureParts } from './RollingNumber.logic';
import type { RollingNumberProps } from './RollingNumber.types';

/**
 * The web half: each digit's column is clipped to one digit's box and slides to its digit once the
 * figure first comes into view (`RollingNumber.css`). Until then, and ever after, the settled figure
 * is what shows, so the page is complete at rest and a figure below the fold rolls for its reader.
 */
export function RollingNumber({ value, variant = 'body', color, bold }: RollingNumberProps) {
  const figure = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = figure.current;
    if (element === null || element.dataset.roll === 'on') return;
    const watch = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting !== true) return;
      watch.disconnect();
      element.dataset.roll = 'on';
    });
    watch.observe(element);
    return () => watch.disconnect();
  }, []);
  return (
    <Text as="span" variant={variant} color={color} bold={bold} className="hg-rolling">
      <span className="hg-spoken-only">{value}</span>
      <span ref={figure} className="hg-rolling-figure" aria-hidden="true">
        {figureParts(value).map((part, index) =>
          part.kind === 'mark' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a figure's places never reorder
            <span key={index}>{part.text}</span>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: a figure's places never reorder
            <span key={index} className="hg-rolling-digit" data-digit={part.digit}>
              <span className="hg-rolling-sizer">{DIGITS[part.digit]}</span>
              <span className="hg-rolling-strip">
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            </span>
          ),
        )}
      </span>
    </Text>
  );
}
