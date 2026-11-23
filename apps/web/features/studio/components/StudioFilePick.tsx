'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { FileChooser, type FileChooserHandle } from '@heliogrid/ui';
import { createContext, type ReactNode, useContext, useRef } from 'react';
import { pickedFileOf } from '../hooks/use-own-picture-file';

/**
 * The system's own file picker for Your picture (`T-M05-002d`, board 1.2), one for the chip's menu
 * and for Pick another. It offers the files the studio reads; the others stay grey.
 */

const ACCEPT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tif',
  '.tiff',
  '.pdf',
  '.dxf',
  '.dwg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/pdf',
  // Android files every DXF and DWG as an unknown type: without it a phone hides every CAD plan.
  // A wrong file picked so is refused by name (`readerOf`).
  'application/octet-stream',
] as const;

const FilePick = createContext<() => void>(() => undefined);

/** Opens the file picker. */
export const useFilePick = () => useContext(FilePick);

export function StudioFilePick({
  studio,
  words,
  children,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  children: ReactNode;
}) {
  const chooser = useRef<FileChooserHandle>(null);
  const pin = studio.read.kind === 'ready' ? studio.read.value.site.pin : null;
  return (
    <FilePick.Provider value={() => chooser.current?.open()}>
      {children}
      <FileChooser
        handle={chooser}
        accept={ACCEPT}
        label={words.pickFile}
        onPick={(file) => {
          if (pin !== null) studio.ownMoves.pickFile(pickedFileOf(file, pin));
        }}
      />
    </FilePick.Provider>
  );
}
