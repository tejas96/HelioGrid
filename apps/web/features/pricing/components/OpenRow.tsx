import type { TranslatedText } from '@heliogrid/contracts';
import { ListRow, ShellGlyph, type ShellGlyphName } from '@heliogrid/ui';

interface OpenRowProps {
  icon?: ShellGlyphName;
  title: TranslatedText;
  open: boolean;
  /** Absent, the row only names what stands open under it: it is no control (1536's trial caps). */
  onToggle?: () => void;
}

/** A row that opens what it names in place, its chevron turned while open (`SCR-M12-01` 18). */
export function OpenRow({ icon, title, open, onToggle }: OpenRowProps) {
  return (
    <ListRow
      icon={icon === undefined ? undefined : <ShellGlyph name={icon} size="md" />}
      title={title}
      trailing={<ShellGlyph name={open ? 'chevron-up' : 'chevron'} size="md" />}
      density="expressive"
      onClick={onToggle}
    />
  );
}
