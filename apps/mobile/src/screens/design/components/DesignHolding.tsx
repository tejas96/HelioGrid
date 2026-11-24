import type { DesignRead } from '@heliogrid/data/react';
import { designPageWords, siteDetailsPageWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, LeadDetailStates, StateRegion, Text, useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../../shell/components/ShellPage';
import { tabRoute } from '../../shell/doors';
import { useOpenTab } from '../../shell/use-open-tab';
import { styles } from '../styles';

/**
 * The design's page before its site has a place: the design named, who it is for, and the way to
 * the phone's own Site details for a reader who may change them.
 */
export function DesignHolding({
  designId,
  read,
  onBack,
}: {
  designId: string;
  read: DesignRead;
  onBack: () => void;
}) {
  const t = useTranslate();
  const format = useFormat();
  const navigation = useNavigation();
  const openTab = useOpenTab();
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
        onBack,
        stripless: true,
        searchless: true,
      }}
    >
      <View ref={frame} style={styles.page}>
        {detail === null ? (
          <LeadDetailStates
            read={read.kind === 'ready' ? { kind: 'loading' } : read}
            words={page.states}
            onBackToList={() => openTab(tabRoute.leads)}
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
