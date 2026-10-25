'use client';

import { EditorSurface } from '../EditorSurface/EditorSurface';
import type { CatalogItemFormProps } from './CatalogItemForm.types';
import { DiscardConfirm } from './DiscardConfirm';
import { ItemFormBody } from './ItemFormBody';
import { ItemFormFoot } from './ItemFormFoot';
import './CatalogItemForm.css';

/** The panel's width at 1536, and the layer width under which the add sheet is a sheet. */
const PANEL_WIDTH = 900;
const PANEL_ABOVE = 720;

/**
 * The add sheet on the web (`SCR-M01-16`): a 900px non-modal side panel over the page that opened
 * it, drawing the 1536 frames, and below the panel's width a full-height modal sheet drawing the
 * 375 frames. Which width is drawn is `EditorSurface`'s answer, never the window's. The discard
 * confirm rises over either.
 */
export function CatalogItemForm(props: CatalogItemFormProps) {
  const { words } = props;
  return (
    <>
      <EditorSurface
        open={props.open}
        onClose={props.onCancel}
        closeLabel={words.close}
        panelAbove={PANEL_ABOVE}
        width={PANEL_WIDTH}
        modal={false}
        showClose
        density="functional"
        overline={words.overline === '' ? undefined : words.overline}
        title={words.title}
        sheetProps={{
          modal: true,
          showClose: false,
          size: 'full',
          footer: <ItemFormFoot props={props} wide={false} />,
        }}
        panelProps={{ footer: <ItemFormFoot props={props} wide /> }}
      >
        {({ panel }) => <ItemFormBody props={props} wide={panel} />}
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
