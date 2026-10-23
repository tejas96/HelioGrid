import { Banner } from '../Banner/Banner';
import { Button } from '../Button/Button';
import { EditorSurface } from '../EditorSurface/EditorSurface';
import { Input } from '../Input/Input';
import { PhotoField } from '../PhotoField/PhotoField';
import { editorPhoto } from './NameAndPhotoEditor.logic';
import type { NameAndPhotoEditorProps } from './NameAndPhotoEditor.types';

/** The editor on the web: the 480 right panel with its close, or the sheet below the panel width. */
export function NameAndPhotoEditor({
  open,
  words,
  frame,
  name,
  picture,
  onName,
  onChoosePhoto,
  onDropPhoto,
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
          <div className="hg-name-photo-editor">
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
              onDrop={panel ? onDropPhoto : undefined}
              error={photo.error}
              errorTitle={photo.errorTitle}
            />
          </div>
        );
      }}
    </EditorSurface>
  );
}
