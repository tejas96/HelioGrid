import { classNames } from '../class-names';
import type { BoxProps, StackProps } from './Box.types';

interface WebBoxProps extends BoxProps {
  className?: string;
}

interface WebStackProps extends StackProps {
  className?: string;
}

/** Layout block. Spacing rides on data attributes into Box.css — never inline style. */
export function Box({ children, padding, paddingX, paddingY, className }: WebBoxProps) {
  return (
    <div
      className={classNames('hg-box', className)}
      data-p={padding}
      data-px={paddingX}
      data-py={paddingY}
    >
      {children}
    </div>
  );
}

/** Box with flow: direction, scale-stepped gap, alignment. */
export function Stack({
  children,
  padding,
  paddingX,
  paddingY,
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  className,
}: WebStackProps) {
  return (
    <div
      className={classNames('hg-box', 'hg-stack', className)}
      data-p={padding}
      data-px={paddingX}
      data-py={paddingY}
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? 'true' : undefined}
    >
      {children}
    </div>
  );
}
