import { useEffect, useRef } from 'react';
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
  const foot = usePrimaryAfterReturn(props.returned);
  return (
    <div className="hg-item-foot" data-wide={wide} ref={foot}>
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

/**
 * *Try again* and *Dismiss* leave with the returned line they sit in, so once it goes focus lands on
 * the primary — never at the page's start (`CatalogItems`' `useRetryFocus` does the same).
 */
function usePrimaryAfterReturn(returned: boolean) {
  const foot = useRef<HTMLDivElement>(null);
  const was = useRef(returned);
  useEffect(() => {
    if (was.current && !returned) {
      foot.current?.querySelectorAll<HTMLElement>('.hg-item-foot-act')[1]?.focus();
    }
    was.current = returned;
  }, [returned]);
  return foot;
}
