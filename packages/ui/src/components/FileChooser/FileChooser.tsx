'use client';
import { useImperativeHandle, useRef } from 'react';
import type { FileChooserProps } from './FileChooser.types';

/** The web's file picker: a hidden file input, opened through its handle. */
export function FileChooser({ accept, label, onPick, handle }: FileChooserProps) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(handle, () => ({ open: () => input.current?.click() }), []);
  return (
    <input
      ref={input}
      hidden
      type="file"
      accept={accept.join(',')}
      aria-label={label}
      tabIndex={-1}
      onChange={(event) => {
        const file = event.target.files?.[0];
        // Cleared, so the same file picked again after a refusal is still a pick.
        event.target.value = '';
        if (file !== undefined) onPick(file);
      }}
    />
  );
}
