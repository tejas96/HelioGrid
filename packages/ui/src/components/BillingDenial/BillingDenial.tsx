import { ShellGlyph } from '../AppShell';
import { BillingValueText } from '../BillingStrip/BillingValue';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { FactRow, FactRows } from '../FactRow';
import { ScopeNote } from '../ScopeNote';
import { SheetActions } from '../Sheet';
import type { BillingDenialProps } from './BillingDenial.types';

/** The two lists' marks: the pause and the tick, as the strip draws them (decision 10). */
const MARK = {
  paused: <ShellGlyph name="pause" size="sm" tone="warning" />,
  works: <ShellGlyph name="tick" size="sm" tone="success" />,
  until: <ShellGlyph name="clock" size="sm" tone="secondary" />,
  amount: <ShellGlyph name="rupee" size="sm" tone="secondary" />,
} as const;

/**
 * `SCR-SHELL-06`'s denial: a sheet at 375, a centred modal at 1536, rising as the overlay's own
 * motion (`F7-51`). Its ONE act is the strip's; a person who is not the Owner reads whose it is.
 */
export function BillingDenial({
  denial,
  words,
  onAct,
  onClose,
  acting,
  failure,
}: BillingDenialProps) {
  return (
    <EditorSurface
      open={denial !== null}
      onClose={onClose}
      desktop="modal"
      size="auto"
      density="expressive"
      showClose
      closeLabel={words.closeLabel}
      title={denial?.title}
      overline={denial?.overline}
      footer={
        denial === null ? undefined : denial.act === null ? (
          denial.scope === null ? undefined : (
            <ScopeNote title={denial.scope} variant="line" size={13} />
          )
        ) : (
          <SheetActions>
            <Button
              figures={{ values: denial.act.figures, spoken: denial.act.spoken }}
              loading={acting === true}
              onClick={onAct}
            >
              {denial.act.label}
            </Button>
          </SheetActions>
        )
      }
    >
      {denial === null ? null : (
        <>
          <FactRows label={words.lists} density="expressive" form="lead">
            {denial.rows.map((row) => (
              <FactRow
                key={row.key}
                mark={MARK[row.mark]}
                label={row.label}
                value={<BillingValueText value={row.value} />}
              />
            ))}
          </FactRows>
          {failure === null || failure === undefined ? null : (
            <span role="alert" className="hg-billing-strip-failure">
              {failure}
            </span>
          )}
        </>
      )}
    </EditorSurface>
  );
}
