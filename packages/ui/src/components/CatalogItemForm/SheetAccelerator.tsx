import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { IrisTile } from '../IrisTile/IrisTile';
import './SheetAccelerator.css';
import type { SheetAcceleratorProps, WideProps } from './CatalogItemForm.parts.types';

/**
 * *Add many at once from a spreadsheet* (`SCR-M01-16`): the one accelerator the add sheet offers,
 * a raised tile that fills its row and hands the person to the import wizard.
 */
export function SheetAccelerator({
  title,
  sub,
  disabled,
  wide,
  onPress,
}: SheetAcceleratorProps & WideProps) {
  return (
    <Pressable className="hg-item-accelerator" disabled={disabled} onPress={onPress}>
      <IrisTile glyph="spreadsheet" iris="blue" size={40} stroke={1.6} />
      <span className="hg-item-accelerator-words">
        <span className="hg-item-accelerator-title">{title}</span>
        <span className="hg-item-accelerator-sub">{sub}</span>
      </span>
      <ShellGlyph name="chevron-right" size={wide ? 'sm' : 'md'} tone="secondary" />
    </Pressable>
  );
}
