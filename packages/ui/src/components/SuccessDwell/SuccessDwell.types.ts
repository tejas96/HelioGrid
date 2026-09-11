/**
 * The beat after the code is accepted (`DONE_DWELL_MS`): a centred mark that owns the whole page,
 * drawn because on a slow hand-off it is the only thing saying it worked, and it names where the
 * person is going. The words are the caller's.
 */
export interface SuccessDwellProps {
  title: string;
  /** Where the person is being taken — "Taking you to your company setup". */
  line: string;
}
