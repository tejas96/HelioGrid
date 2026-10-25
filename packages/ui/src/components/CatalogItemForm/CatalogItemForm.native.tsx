import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import type { CatalogItemFormProps } from './CatalogItemForm.types';
import { DiscardConfirm } from './DiscardConfirm.native';
import { ItemFormBody } from './ItemFormBody.native';
import { ItemFormFoot } from './ItemFormFoot.native';

/** The layer width under which the add sheet is a sheet: every phone. */
const PANEL_ABOVE = 720;

/**
 * The add sheet on the phone (`SCR-M01-16`, the 375 frames): a full-height modal sheet over the
 * page that opened it, its handle and no close button; the body scrolls under the head and over
 * the foot. The discard confirm rises over it.
 */
export function CatalogItemForm(props: CatalogItemFormProps) {
  const { words } = props;
  return (
    <>
      <EditorSurface
        open={props.open}
        onClose={props.onCancel}
        closeLabel={words.close}
        inset
        panelAbove={PANEL_ABOVE}
        size="full"
        density="functional"
        overline={words.overline === '' ? undefined : words.overline}
        title={words.title}
        footer={<ItemFormFoot props={props} />}
      >
        <ItemFormBody props={props} />
      </EditorSurface>
      <DiscardConfirm
        open={props.open && props.confirmingDiscard}
        words={words.discard}
        onKeep={props.onKeep}
        onDiscard={props.onDiscard}
      />
    </>
  );
}
