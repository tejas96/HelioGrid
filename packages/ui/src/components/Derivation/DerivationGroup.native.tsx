import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import type { DerivationGroupProps } from './Derivation.types';
import { DerivationGroupContext, useDerivationGroup } from './DerivationGroup.context';

interface NativeDerivationGroupProps extends DerivationGroupProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * **What makes forty derivations on one BOM survivable.** Single-open by default — opening the
 * fortieth closes the thirty-ninth, so at most one panel exists at a time. `mode="many"` opts a
 * small set out of that; neither mode is an `openAll`.
 *
 * `printAs` is carried and honoured by the registry (panels still register their parts, so a
 * caller can hand the same tree to the web/print surface), but **nothing is rendered for it here**:
 * a phone has no paper, and drawing the appendix on screen would put every explanation twice on a
 * surface whose whole constraint is that forty of them fit.
 */
export function DerivationGroup({
  children,
  mode = 'single',
  printAs = 'appendix',
  style,
}: NativeDerivationGroupProps) {
  const { context } = useDerivationGroup(mode, printAs);
  return (
    <DerivationGroupContext.Provider value={context}>
      <View style={style}>{children}</View>
    </DerivationGroupContext.Provider>
  );
}
