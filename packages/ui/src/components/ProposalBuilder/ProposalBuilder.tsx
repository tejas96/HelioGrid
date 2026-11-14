import { BuilderDesktop } from './BuilderDesktop';
import { BuilderPhone } from './BuilderPhone';
import type { ProposalBuilderProps } from './ProposalBuilder.types';
import './ProposalBuilder.css';

/**
 * The builder's frame (`T-M06-002`): the phone form, or the desktop form where the caller has the
 * room. Both draw the same steps, in the same order, and neither ever blocks a move (`M06-22`).
 */
export function ProposalBuilder(props: ProposalBuilderProps) {
  return props.wide ? <BuilderDesktop {...props} /> : <BuilderPhone {...props} />;
}
