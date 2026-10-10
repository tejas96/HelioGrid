import { EmptyState, Text } from '@heliogrid/ui';
import type { ReactNode } from 'react';

/**
 * A page inside the shell with nothing on it yet: its title, spoken as the page's heading and shown
 * as an empty state, with a line under it or one way on.
 */
export function EmptyShellPage({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hg-shell-page">
      {/* The page's heading for a screen reader: the title it names is already on screen. */}
      <Text as="h1" spokenOnly>
        {title}
      </Text>
      <EmptyState title={title} description={description} action={action} />
    </div>
  );
}
