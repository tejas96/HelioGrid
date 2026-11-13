'use client';

/**
 * Saves text the page made as a file in the browser's downloads — an export (`M13-52`). The link
 * is made, pressed and let go at once, so no object URL outlives the save.
 */
export function saveTextFile(name: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
