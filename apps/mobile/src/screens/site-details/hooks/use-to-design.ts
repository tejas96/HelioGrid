import { StackActions, useNavigation } from '@react-navigation/native';

/**
 * The move from Site details to its design. The studio below opened the form: back to it — told,
 * after a save, to open again on the saved site; after a way back with nothing saved, as it was.
 * Else the design opens in the form's place, so Back skips the form.
 */
export function useToDesign(): (designId: string, saved: boolean) => void {
  const navigation = useNavigation();
  return (designId, saved) => {
    const { routes, index } = navigation.getState() ?? { routes: [], index: 0 };
    const below = routes[index - 1];
    const sameDesign =
      below?.name === 'Design' &&
      (below.params as { designId?: string } | undefined)?.designId === designId;
    if (!sameDesign) navigation.dispatch(StackActions.replace('Design', { designId }));
    else if (saved) {
      navigation.dispatch(StackActions.popTo('Design', { designId, siteSavedAt: Date.now() }));
    } else navigation.goBack();
  };
}
