import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { DoorFrame } from '../DoorFrame/DoorFrame.native';
import { Explainer } from '../Explainer/Explainer.native';
import { Input } from '../Input/Input.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { PhotoField } from '../PhotoField/PhotoField.native';
import type { FirstRunProfileProps } from './FirstRunProfile.types';

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  headingText: { flexShrink: 1 },
  column: { gap: theme.spacing['sp-5'] },
  /* Right under the photo group, never pinned to the screen's foot (ruling 13). */
  act: { paddingTop: theme.spacing['sp-3'] },
});

/**
 * First-Run Profile in the phone's one column (`SCR-M01-09` m-normal): the heading with its ask,
 * the name, the photo with the camera act — which opens the photo library (ruling 19) — and the act
 * right under the photo group, in the column, so a short screen leaves the space below it empty.
 * Nothing drags on a phone, so no photo is dropped here.
 */
export function FirstRunProfile({
  language,
  words,
  frame,
  name,
  picture,
  onName,
  onChoosePhoto,
  onRemovePhoto,
  onRetryPhoto,
  onSave,
}: FirstRunProfileProps) {
  const { label, title, pages, nextLabel, backLabel, positionLabel } = words.about;
  const loading = frame.kind === 'loading';
  const retry = frame.photoAct === 'retry';
  const { photo } = words;
  return (
    <DoorFrame
      trailing={language}
      identity={
        <View style={styles.heading}>
          <Text variant="h2" style={styles.headingText}>
            {words.heading}
          </Text>
          <Explainer
            label={label}
            title={title}
            pages={pages}
            nextLabel={nextLabel}
            backLabel={backLabel}
            positionLabel={positionLabel}
          />
        </View>
      }
    >
      <View style={styles.column}>
        {words.saveFailed === null ? null : (
          <Banner kind="validation" title={words.saveFailed.title}>
            {words.saveFailed.line}
          </Banner>
        )}
        {loading ? (
          <LoadingBars label={words.name.loading} bars={['row']} />
        ) : (
          <Input
            label={words.name.label}
            value={name}
            onChange={onName}
            helper={words.name.helper}
            error={words.name.error ?? undefined}
            success={words.name.success ?? undefined}
          />
        )}
        <PhotoField
          label={photo.label}
          src={frame.photo.kind === 'chosen' ? picture : undefined}
          name={loading ? '' : name}
          size={72}
          actIcon={retry ? 'retry' : 'camera'}
          chooseLabel={photo.choosePhone}
          replaceLabel={photo.replace}
          removeLabel={photo.remove}
          onChoose={retry ? onRetryPhoto : onChoosePhoto}
          onRemove={onRemovePhoto}
          error={photo.error?.phone}
          errorTitle={photo.error?.title}
          helper={photo.helper}
          loading={loading || (frame.busy && frame.nameSaved)}
          disabled={frame.busy}
        />
        <View style={styles.act}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={frame.busy}
            disabled={loading}
            disabledReason={words.actReason ?? undefined}
            onClick={onSave}
          >
            {words.act}
          </Button>
        </View>
      </View>
    </DoorFrame>
  );
}
