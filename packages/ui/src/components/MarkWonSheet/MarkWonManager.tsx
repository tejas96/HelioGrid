import { useRef } from 'react';
import { Text } from '../../primitives/Text/Text';
import { RetryButton } from '../Button/RetryButton';
import { LoadingBars } from '../LoadingBars';
import { Select } from '../Select';
import { managerSelectOf } from './MarkWonSheet.logic';
import type { MarkWonManagerFieldProps } from './MarkWonSheet.types';

/**
 * Who manages the project: the only one picked and said so, else a choice with the chosen one's live
 * projects under it. While the managers load it waits in place; failed, it says so with *Try
 * again*, and focus stays on the field's own frame while it loads again.
 */
export function MarkWonManagerField(props: MarkWonManagerFieldProps) {
  const { words, managers } = props;
  const frame = useRef<HTMLDivElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-mark-won-manager hg-focus-target">
      {managers.kind === 'loading' || managers.kind === 'failed' ? (
        <Text variant="field-label" as="span">
          {words.manager}
        </Text>
      ) : null}
      {managers.kind === 'loading' ? (
        <LoadingBars bars={['control']} label={words.managersLoading} />
      ) : managers.kind === 'failed' ? (
        <div className="hg-mark-won-manager-failed">
          <Text variant="body-sm" color="danger">
            {words.managersFailed}
          </Text>
          <RetryButton onRetry={managers.retry} label={words.retry} focusAfter={frame} size="sm" />
        </div>
      ) : (
        <Select {...managerSelectOf(props)} />
      )}
    </div>
  );
}
