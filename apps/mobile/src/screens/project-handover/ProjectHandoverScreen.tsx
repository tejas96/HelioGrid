import { useHandover, useProjectScreen } from '@heliogrid/data/react';
import {
  destinationLabel,
  handoverWords,
  projectDetailWords,
  projectPackWords,
} from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { HandoverPanel, ProjectDetailStates, useFormat } from '@heliogrid/ui';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { Linking, Share, View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { styles } from './styles';

/** A project's handover at `heliogrid://projects/<id>/handover`. */
type Props = StaticScreenProps<{ projectId: string }>;

/**
 * The handover on the phone (`SCR-M08-06`): the project manager finishing a job, often at the
 * customer's door, one hand on the phone — they came to see that nothing waits, hand over, open
 * the pack, send the ready message from their own apps, and ask for a referral while the customer
 * is happy. What is read and sent is `useHandover`'s and `useProjectScreen`'s, the web's too; the
 * phone's own parts are the share sheet and the viewer the pack opens in.
 */
export function ProjectHandoverScreen({ route }: Props) {
  const { projectId } = route.params;
  const { t, locale } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const screen = useProjectScreen(projectId);
  const { read } = screen;
  const project = read.kind === 'ready' ? read.value.project : null;
  const handover = useHandover(projectId, project?.customer.id ?? '', project !== null);
  const word = projectPackWords(format.pack, locale);
  const words = handoverWords(t, word);
  const detailWords = projectDetailWords(t, word, format.date);
  const page = useRef<View>(null);
  const back = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ProjectDetail', { projectId });
  };
  return (
    <ShellPage
      inView="projects"
      drillDown={{
        title: project === null ? destinationLabel(t, 'projects') : words.title,
        summary:
          project === null || handover.handedOver
            ? undefined
            : words.summary(project.customer.name ?? project.number, project.customer.city),
        back: detailWords.back,
        onBack: back,
      }}
    >
      <View ref={page} style={styles.page}>
        {read.kind !== 'ready' ? (
          <ProjectDetailStates read={read} words={detailWords} focusAfter={page} />
        ) : (
          <HandoverPanel
            preview={handover.preview}
            project={read.value.project}
            opening={read.value.view.handover}
            words={words}
            pack={handover.pack}
            onDownload={(fileId) => {
              void screen
                .fileLink(fileId)
                .then((url) => Linking.openURL(url))
                .catch(() => undefined);
            }}
            onLookAgain={handover.lookAgain}
            onOpenRow={() => navigation.navigate('ProjectDocuments', { projectId })}
            onHandOver={() => screen.send({ kind: 'handover' })}
            sending={screen.sending}
            failure={detailWords.said(screen.refusal, screen.failed)}
            onShare={(text) => {
              void Share.share({ message: text }).catch(() => undefined);
            }}
            onCopy={null}
            copied={false}
            onRefer={handover.refer}
            referring={handover.referring}
            referred={handover.referred}
            referralKnown={handover.referralKnown}
            referralFailed={handover.referralFailed}
            onSkipReferral={back}
          />
        )}
      </View>
    </ShellPage>
  );
}
