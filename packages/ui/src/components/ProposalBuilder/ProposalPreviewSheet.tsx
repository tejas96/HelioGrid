import { EditorSurface } from '../EditorSurface/EditorSurface';
import type { ProposalPreviewSheetProps } from './ProposalBuilder.types';
import './ProposalStepList.css';

/** The page the customer gets, over the step that feeds it (`T-M06-015`): one renderer, so it cannot differ. */
export function ProposalPreviewSheet(props: ProposalPreviewSheetProps) {
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={props.closeLabel}
      showClose
      title={props.title}
      desktop="modal"
    >
      <div className="hg-pbf-preview">
        {props.page}
        <span className="hg-pbf-foot-note">{props.pageLine}</span>
      </div>
    </EditorSurface>
  );
}
