import { Text } from '../../primitives/Text/Text';
import type { TextDividerProps } from './TextDivider.types';

export function TextDivider({ label }: TextDividerProps) {
  return (
    <div className="hg-text-divider">
      <Text variant="caption" color="secondary" align="center">
        {label}
      </Text>
    </div>
  );
}
