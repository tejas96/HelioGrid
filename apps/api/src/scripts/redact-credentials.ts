/**
 * Takes the password out of anything shaped like `scheme://user:secret@host`.
 *
 * A command's stderr is what an operator pastes into a chat window when asking for help, and a
 * database driver puts the whole connection string — password included — into its own message.
 * Every script here that prints a failure runs it over the text first.
 *
 * Its own file, importing NOTHING: a script boots the application context, so importing one to
 * reach a helper inside it runs the environment check and exits the process. A test that reached
 * for this through `publish-pack.ts` died exactly that way in the clean room.
 *
 * The password runs to the LAST `@` before the path, not the first: a password holding an `@` is
 * legal in a driver's own message, and stopping at the first one leaves the rest of it on screen,
 * which is the half-redaction that reads as safe and is not.
 */
export function redactCredentials(text: string): string {
  return text.replace(/([a-z][a-z0-9+.-]*:\/\/[^\s:/]+):[^\s/]*@/gi, '$1:***@');
}
