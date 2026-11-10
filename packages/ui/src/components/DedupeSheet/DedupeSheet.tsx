import { EditorSurface } from '../EditorSurface/EditorSurface';
import { DedupeChoice } from './DedupeChoice';
import { DedupeKeepBoth } from './DedupeKeepBoth';
import { DedupeRecord } from './DedupeRecord';
import { choicesOf, DEDUPE_LAYER, isActWaiting } from './DedupeSheet.logic';
import type { DedupeSheetProps } from './DedupeSheet.types';
import { useKeepBoth } from './use-keep-both';

/**
 * The duplicate sheet (`M02-08`, `M02-09`, `M02-66`): the record the number already belongs to,
 * its three facts, and exactly three choices — the third opening a reason box. It opens on its
 * panel, named by its heading, gives focus back to the capture when it closes, and creates
 * nothing when dismissed. While an act waits every choice and every way out waits with it. Below
 * the editor breakpoint it is a sheet; above it, a decision centred over the capture's side panel.
 */
export function DedupeSheet(props: DedupeSheetProps) {
  const { open, onClose, record, ownerName, stage, canKeepBoth, act, onKeepBoth, words } = props;
  const keepBoth = useKeepBoth(open);
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      title={words.heading}
      subtitle={words.intro}
      dismissible={!isActWaiting(act)}
      desktop="modal"
      zIndex={DEDUPE_LAYER}
    >
      <div className="hg-dedupe-sheet">
        <DedupeRecord record={record} ownerName={ownerName} stage={stage} words={words} />
        <div className="hg-dedupe-choices">
          {choicesOf(props, keepBoth).map((one) => (
            <DedupeChoice key={one.choice} {...one} record={record} act={act} words={words} />
          ))}
          {canKeepBoth && keepBoth.shown ? (
            <DedupeKeepBoth
              reason={keepBoth.reason}
              onReason={keepBoth.setReason}
              onConfirm={onKeepBoth}
              act={act}
              words={words}
            />
          ) : null}
        </div>
        <p className="hg-dedupe-nothing">{words.nothingCreated}</p>
      </div>
    </EditorSurface>
  );
}
