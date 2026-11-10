import { useLeadImportScreen } from '@heliogrid/data/react';
import { catalogImportNotes, leadImportWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { IMPORT_FILE_ACCEPT, IMPORT_FILE_MAX_MB, LeadImport, UnavailableNote } from '@heliogrid/ui';
import { type StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { View } from 'react-native';
import { ShellPage } from '../shell/components/ShellPage';
import { usePickSpreadsheet } from './hooks/use-pick-spreadsheet';
import { styles } from './styles';

/** An import opens at `heliogrid://leads/import?job=<id>` — its notice, or where it was left. */
type Props = StaticScreenProps<{ job?: string } | undefined>;

/**
 * The Lead Import Wizard on the phone (`SCR-M02-05`, the 375 frames): the same four steps as the
 * desk, one column, the file from the system's document picker. What it draws is
 * `useLeadImportScreen`'s, the web's too; the phone's own parts are the picker and the ways back.
 * Leaving mid-run and coming back finds its progress or its report.
 */
export function LeadImportScreen({ route }: Props) {
  const { t } = useI18n();
  const navigation = useNavigation();
  const words = useMemo(() => leadImportWords(t), [t]);
  const notes = useMemo(() => catalogImportNotes(t), [t]);
  const screen = useLeadImportScreen(route.params?.job ?? null);
  const requestFile = usePickSpreadsheet(screen);
  const toLeads = () => navigation.navigate('Leads');
  const file = screen.job;
  return (
    <ShellPage
      inView="leads"
      drillDown={{
        title: words.title,
        ...(file === null || file.counts === null || !screen.allowed
          ? {}
          : { summary: words.subtitle(file.fileName, file.counts.rows) }),
        back: words.backToLeads,
        onBack: toLeads,
      }}
    >
      <View style={styles.page}>
        {screen.allowed ? (
          <LeadImport
            {...screen}
            words={words}
            notice={notes.notice(screen.failure)}
            upload={{
              state: screen.upload.state,
              accept: IMPORT_FILE_ACCEPT,
              maxSizeMB: IMPORT_FILE_MAX_MB,
              message: notes.upload(screen.upload, IMPORT_FILE_MAX_MB),
              // A file the phone could not read is picked again; one that failed to upload is resent.
              onRetry: screen.canRetry ? screen.retry : requestFile,
            }}
            onFiles={() => undefined}
            onRequestFiles={requestFile}
            onReplace={() => {
              screen.onStartOver();
              requestFile();
            }}
            onLeave={toLeads}
            onOpenInbox={() => navigation.navigate('LeadInbox')}
          />
        ) : (
          <UnavailableNote
            variant="region"
            title={words.notAllowed.title}
            message={words.notAllowed.message}
          />
        )}
      </View>
    </ShellPage>
  );
}
