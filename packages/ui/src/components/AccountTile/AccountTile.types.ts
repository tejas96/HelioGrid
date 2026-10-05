/**
 * AccountTile — the account a step acts for, named in a filled tile: a short overline over one
 * bold line ("Signing in with Google" over the email, `SCR-M01-01`'s link step). The line wraps
 * anywhere, so a long email breaks inside the tile rather than past it.
 */
export interface AccountTileProps {
  /** What the account is doing here, already in the reader's language — no English default. */
  overline: string;
  /** The account itself — an email or a name, shown as given. */
  account: string;
}
