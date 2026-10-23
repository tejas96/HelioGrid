import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { Input } from '../Input/Input.native';
import { PhotoField } from '../PhotoField/PhotoField.native';
import { editorPhoto } from './NameAndPhotoEditor.logic';
import type { NameAndPhotoEditorProps } from './NameAndPhotoEditor.types';

/** The editor on the phone: the sheet with its handle; nothing drags, so no drop. */
export function NameAndPhotoEditor({
  open,
  words,
  frame,
  name,
  picture,
  onName,
  onChoosePhoto,
  onRemovePhoto,
  onRetryPhoto,
  onSave,
  onClose,
}: NameAndPhotoEditorProps) {
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      title={words.title}
      width={480}
      dismissible={!frame.busy}
      footer={
        <Button variant="primary" size="lg" fullWidth loading={frame.busy} onClick={onSave}>
          {words.act}
        </Button>
      }
    >
      {({ panel }) => {
        const photo = editorPhoto(words, frame, picture, panel);
        return (
          <View style={styles.column}>
            {words.saveFailed === null ? null : (
              <Banner kind="validation" title={words.saveFailed.title}>
                {words.saveFailed.line}
              </Banner>
            )}
            <Input
              label={words.name.label}
              value={name}
              onChange={onName}
              error={words.name.error ?? undefined}
              success={words.name.success ?? undefined}
            />
            <PhotoField
              label={words.photo.label}
              src={photo.src}
              name={name}
              size={photo.size}
              actIcon={photo.actIcon}
              chooseLabel={photo.chooseLabel}
              replaceLabel={words.photo.replace}
              removeLabel={words.photo.remove}
              onChoose={photo.retry ? onRetryPhoto : onChoosePhoto}
              onRemove={onRemovePhoto}
              error={photo.error}
              errorTitle={photo.errorTitle}
            />
          </View>
        );
      }}
    </EditorSurface>
  );
}

const styles = StyleSheet.create({
  column: { gap: theme.spacing['sp-5'] },
});
