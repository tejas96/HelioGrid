import { StyleSheet } from 'react-native';
import { Explainer } from '../Explainer/Explainer.native';
import { reasonPage } from './ActionReason.logic';
import type { ReasonExplainerProps } from './ActionReason.types';

/**
 * A disabled act's reason, opened in the `Explainer` bubble above the host's control by a tap — the
 * same object as the web half. React Native has no off-screen text node, so the sentence reaches a
 * screen reader through `spokenReason`, which the control speaks after its name.
 */
export function ReasonExplainer({ spec, id, open, block = false, children }: ReasonExplainerProps) {
  const page = reasonPage(spec);
  const spoken = typeof page === 'string' && page !== '' ? page : undefined;
  return (
    <Explainer
      label={spoken ?? ''}
      pages={page}
      placement="top"
      density="functional"
      open={open}
      style={block ? styles.block : undefined}
      trigger={(triggerProps) =>
        children(
          spoken === undefined
            ? { ...triggerProps, describedBy: id }
            : { ...triggerProps, describedBy: id, spokenReason: spoken },
        )
      }
    />
  );
}

const styles = StyleSheet.create({ block: { alignSelf: 'stretch' } });
