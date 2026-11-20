import {
  type SiteDetailsScreen as SiteDetailsView,
  useSiteDetailsScreen,
} from '@heliogrid/data/react';
import { siteDetailsPageWords, siteDetailsWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import {
  LeadDetailStates,
  LeaveConfirm,
  SiteDetails,
  type SiteDetailsActs,
  useFormat,
} from '@heliogrid/ui';
import { type StaticScreenProps, useNavigation, usePreventRemove } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { sitePinTilesOf } from './components/SitePinTiles';
import { useToDesign } from './hooks/use-to-design';
import { styles } from './styles';

/** Site details open at `heliogrid://designs/<id>/site` — from *Create design* and from a design's own page. */
type Props = StaticScreenProps<{ designId: string }>;

/** What each control of the form reports, as the screen's hook answers it. */
function actsOf(screen: SiteDetailsView, onCancel: () => void): SiteDetailsActs {
  const { acts } = screen;
  return {
    onName: acts.name,
    onMount: acts.mount,
    onMode: acts.mode,
    onAddress: acts.address,
    onPickPlace: acts.pickPlace,
    onLatitude: acts.latitude,
    onLongitude: acts.longitude,
    onCoordinatesRead: acts.readCoordinates,
    onPaste: acts.paste,
    onPutBack: acts.putBack,
    onArea: acts.area,
    onOperator: acts.operator,
    onPhase: acts.phase,
    onLoad: acts.load,
    onCancel,
    onStart: screen.start,
  };
}

/**
 * Site details on the phone (`SCR-M05-01`): a rep at the customer's house confirms the place
 * before drawing — the address the lead already holds is there, the pin is moved to the right
 * roof, and one button starts the design. What is read, decided and saved is
 * `useSiteDetailsScreen`'s, the web's too; the phone's own parts are the ways back, held while a
 * change stands, and the move to the design.
 */
export function SiteDetailsScreen({ route }: Props) {
  const { t, locale } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const { designId } = route.params;
  const toDesign = useToDesign();
  const screen = useSiteDetailsScreen(
    designId,
    { formats: format.pack, language: locale },
    { toDesign: (id) => toDesign(id, true) },
  );
  /* The bar's way back and the system Back both remove the page: each is held while a change stands. */
  usePreventRemove(screen.changed, ({ data }) =>
    screen.leave.ask(() => navigation.dispatch(data.action)),
  );
  const page = siteDetailsPageWords(t);
  const frame = useRef<View>(null);
  const { read } = screen;
  const shown = read.kind === 'ready' ? read.value : null;
  /* A started design's form came from its studio: its way back opens the studio again. */
  const leave = () => {
    if (shown?.started) toDesign(designId, false);
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Leads');
  };
  const subject = shown?.detail.subject ?? null;
  /* A reader without the design grant has nothing to fill here: the design's own page shows the site. */
  const locked = shown !== null && !shown.detail.canEdit;
  const open = useRef(toDesign);
  open.current = toDesign;
  useEffect(() => {
    if (locked) open.current(designId, false);
  }, [locked, designId]);
  const summary =
    subject === null
      ? null
      : page.forWho(
          subject.customerName,
          subject.customerPhone === null ? null : format.phone(subject.customerPhone),
        );
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        title: page.title,
        ...(summary === null ? {} : { summary }),
        back: page.states.backToList,
        onBack: leave,
        stripless: true,
        searchless: true,
      }}
    >
      <View ref={frame} style={styles.page}>
        {shown === null || locked ? (
          <LeadDetailStates
            read={read.kind === 'ready' ? { kind: 'loading' } : read}
            words={page.states}
            onBackToList={() => navigation.navigate('Leads')}
            focusAfter={frame}
          />
        ) : (
          <SiteDetails
            room="narrow"
            form={shown.form}
            areas={shown.areas}
            operators={shown.operators}
            search={shown.search}
            pinMoved={shown.pinMoved}
            pin={shown.pin}
            map={{
              tiles: sitePinTilesOf(shown.form.pin, screen.acts.movePin, screen.map),
              read: screen.map.read,
              big: screen.map.big,
              onBig: screen.map.open,
              onSmall: screen.map.close,
            }}
            saving={screen.saving}
            failure={screen.failure === null ? null : page.saveFailed(screen.failure)}
            acts={actsOf(screen, leave)}
            words={siteDetailsWords(t, shown.started)}
          />
        )}
      </View>
      <LeaveConfirm
        open={screen.leave.asking}
        title={page.leaveTitle}
        body={page.leaveBody}
        discard={page.leaveConfirm}
        keep={page.keepEditing}
        onKeep={screen.leave.stay}
        onLeave={screen.leave.leave}
      />
    </ShellPage>
  );
}
