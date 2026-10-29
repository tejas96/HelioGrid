import { useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Button } from '../Button/Button';
import { PendingAction } from '../PendingAction/PendingAction';
import type { CatalogItemFormProps } from './CatalogItemForm.types';
import './ItemFormFoot.css';

export interface ItemFormFootProps {
  props: CatalogItemFormProps;
  /** The 1536 panel's line and spacing, or the 375 sheet's. */
  wide: boolean;
}

/**
 * The sheet's foot (`SCR-M01-16`): the line read before acting, centred — or, when the create came
 * back unsent, the returned line with *Try again* and *Dismiss* in its place — then *Cancel* and
 * the primary side by side, the primary busy while the create is out.
 */
export function ItemFormFoot({ props, wide }: ItemFormFootProps) {
  const { words } = props;
  /* *Try again* and *Dismiss* leave with the returned line they sit in: focus lands on the primary,
     never at the page's start. */
  const primary = useRef<FocusHandle>(null);
  return (
    <div className="hg-item-foot" data-wide={wide}>
      {props.returned ? (
        <PendingAction
          className="hg-item-foot-returned"
          state="returned"
          label={words.primary}
          reason={words.returned}
          onRetry={props.onRetry}
          retryLabel={words.tryAgain}
          onDismiss={props.onDismissReturned}
          dismissLabel={words.dismiss}
          focusAfter={primary}
        />
      ) : (
        <p className="hg-item-foot-line">{wide ? words.consequence : words.consequenceNarrow}</p>
      )}
      <div className="hg-item-foot-acts">
        <Button className="hg-item-foot-act" variant="secondary" onClick={props.onCancel}>
          {words.cancel}
        </Button>
        <Button
          className="hg-item-foot-act"
          ref={primary}
          variant="primary"
          loading={props.saving}
          onClick={props.saving ? undefined : props.onSubmit}
        >
          {words.primary}
        </Button>
      </div>
    </div>
  );
}
