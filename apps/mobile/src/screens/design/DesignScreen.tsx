import { useDesignScreen } from '@heliogrid/data/react';
import { designPageWords, siteDetailsPageWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, LeadDetailStates, StateRegion, Text, useFormat } from '@heliogrid/ui';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { styles } from './styles';

/** A design opens at `heliogrid://designs/<id>` — from its lead's Designs section and from Site details. */
type Props = StaticScreenProps<{ designId: string }>;

/**
 * One design's own page on the phone (`SCR-M05-02`): where the studio opens. Until the roof step
 * is built it names the design, says who it is for and where the site is, and says plainly what
 * comes next — with the way to the Site details for a reader who may change them.
 */
export function DesignScreen({ route }: Props) {
  const t = useTranslate();
  const format = useFormat();
  const navigation = useNavigation();
  const { designId } = route.params;
  const { read } = useDesignScreen(designId);
  const page = siteDetailsPageWords(t);
  const words = designPageWords(t);
  const frame = useRef<View>(null);
  const detail = read.kind === 'ready' ? read.value : null;
  const subject = detail?.subject ?? null;
  const summary =
    subject === null
      ? null
      : page.forWho(
          subject.customerName,
          subject.customerPhone === null ? null : format.phone(subject.customerPhone),
        );
  const toLead = (leadId: string) => navigation.navigate('LeadDetail', { leadId });
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        title: detail === null ? page.title : words.named(detail.design.ordinal),
        ...(summary === null ? {} : { summary }),
        back: page.states.backToList,
        onBack: () => {
          if (navigation.canGoBack()) navigation.goBack();
          else if (subject !== null) toLead(subject.leadId);
          else navigation.navigate('Leads');
        },
        stripless: true,
        searchless: true,
      }}
    >
      <View ref={frame} style={styles.page}>
        {detail === null ? (
          <LeadDetailStates
            read={read.kind === 'ready' ? { kind: 'loading' } : read}
            words={page.states}
            onBackToList={() => navigation.navigate('Leads')}
            focusAfter={frame}
          />
        ) : (
          <StateRegion
            glyph="solar-panel"
            scene="settle"
            title={words.holdingTitle}
            message={
              <>
                {/* The frame sets its message as one run of text: the address ends its own line. */}
                {detail.site.address === null ? null : (
                  <Text variant="body" align="center">
                    {`${detail.site.address}\n`}
                  </Text>
                )}
                <Text variant="body-sm" color="secondary" align="center">
                  {words.holdingLine(detail.design.mount, detail.site.pin !== null)}
                </Text>
              </>
            }
            action={
              detail.canEdit ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigation.navigate('SiteDetails', { designId })}
                >
                  {words.editSite}
                </Button>
              ) : (
                <Button variant="secondary" size="lg" onClick={() => toLead(detail.subject.leadId)}>
                  {words.backToLead}
                </Button>
              )
            }
          />
        )}
      </View>
    </ShellPage>
  );
}
