import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { AppShellProps } from './AppShell.types';

interface WebAppShellProps extends AppShellProps {
  className?: string;
  style?: CSSProperties;
}

/** Rail on the left, header on top, scrolling content below — the whole desktop shell. */
export function AppShell({ rail, header, children, className, style }: WebAppShellProps) {
  return (
    <div className={classNames('hg-app-shell', className)} style={style}>
      {rail}
      <div className="hg-app-shell-column">
        {header}
        <main className="hg-app-shell-main">{children}</main>
      </div>
    </div>
  );
}
