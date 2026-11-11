import type { FilePickTarget, FilePlace, PickedFile, ProjectScreen } from '@heliogrid/data/react';
import { filePickWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { choosePdf, choosePhoto, takePhoto } from '../../files/pick-file';

/**
 * The phone's one file chooser — the platform adapter a lead's files, the project page and the
 * installer's job share: the pick that did not go up goes again, else the system's own chooser
 * opens (the camera, the photos, or a PDF where the place takes one) and the picked file goes up.
 * A photo is named for the moment it was taken or chosen.
 */
export function useFilePick(): (target: FilePickTarget, photoOnly?: boolean) => void {
  const { t } = useI18n();
  const format = useFormat();
  const words = filePickWords(t);
  const photoName = () => {
    const now = new Date();
    return words.photoName(format.date(now), format.clockAt(now.toISOString()));
  };
  const choices: readonly { label: string; pick: () => Promise<PickedFile | null> }[] = [
    { label: words.camera, pick: () => takePhoto(photoName()) },
    { label: words.photos, pick: () => choosePhoto(photoName()) },
    { label: words.pdf, pick: choosePdf },
  ];
  return (target, photoOnly = false) => {
    if (target.uploadFailed) {
      target.retryUpload();
      return;
    }
    // An install step's evidence is a photo (`M08-45`): no PDF is offered for it.
    const offered = photoOnly ? choices.slice(0, 2) : choices;
    const title = photoOnly ? words.photoTitle : words.title;
    const pickFrom = (index: number) => {
      void offered[index]?.pick().then(
        (file) => {
          if (file !== null) target.upload(file);
        },
        () => undefined,
      );
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...offered.map((choice) => choice.label), words.cancel],
          cancelButtonIndex: offered.length,
        },
        pickFrom,
      );
      return;
    }
    Alert.alert(
      title,
      undefined,
      offered.map((choice, index) => ({ text: choice.label, onPress: () => pickFrom(index) })),
      { cancelable: true },
    );
  };
}

/**
 * The one chooser for a place on a project: a row's document, another file — or a step's photo,
 * where only a photo is offered.
 */
export function useProjectFilePick(screen: ProjectScreen): (place: FilePlace) => void {
  const pick = useFilePick();
  return (place) => {
    const failed = screen.uploadFailed;
    pick(
      {
        upload: (file) => screen.upload(file, place),
        uploadFailed:
          failed !== null && failed.slot === place.slot && failed.slotKey === place.slotKey,
        retryUpload: screen.retryUpload,
      },
      place.slot === 'step',
    );
  };
}
