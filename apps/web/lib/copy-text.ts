/**
 * Puts text on the clipboard: `copied` once it is there, `notCopied` when the browser refuses — a
 * page served without the clipboard (an insecure origin) or a refused permission — so a refusal is
 * always said where the person acted, never swallowed.
 */
export function copyText(text: string, copied: () => void, notCopied: () => void): void {
  if (navigator.clipboard === undefined) {
    notCopied();
    return;
  }
  void navigator.clipboard.writeText(text).then(copied, notCopied);
}
