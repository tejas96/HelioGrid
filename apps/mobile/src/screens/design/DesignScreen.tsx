import { useDesignScreen } from '@heliogrid/data/react';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { DesignHolding } from './components/DesignHolding';
import { StudioPage } from './components/StudioPage';

/** A design opens at `heliogrid://designs/<id>` — from its lead's Designs section and from Site details. */
type Props = StaticScreenProps<{
  designId: string;
  /** Site details saved a change: the studio opens again on the saved site. */
  siteSavedAt?: number;
}>;

/**
 * One design's own page on the phone (`SCR-M05-02`): the studio (`T-M05-002a`), the web's own page
 * in a web view, edge to edge inside the safe areas. A design whose site has no place yet names
 * the design and offers the phone's own Site details first.
 */
export function DesignScreen({ route }: Props) {
  const navigation = useNavigation();
  const { designId, siteSavedAt } = route.params;
  const { read } = useDesignScreen(designId);
  const detail = read.kind === 'ready' ? read.value : null;
  const back = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else if (detail !== null) navigation.navigate('LeadDetail', { leadId: detail.subject.leadId });
    else navigation.navigate('Leads');
  };
  if (detail !== null && detail.site.pin !== null) {
    // Site details open over the studio; their save, Cancel and the system back come back to it.
    const toSite = () => navigation.navigate('SiteDetails', { designId });
    return <StudioPage designId={designId} savedAt={siteSavedAt} onLeave={back} onSite={toSite} />;
  }
  return <DesignHolding designId={designId} read={read} onBack={back} />;
}
