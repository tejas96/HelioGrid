import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { ExplainerPage } from '../Explainer/Explainer.types';
import type { ActionReasonSpec } from './ActionReason.types';

/** The sentence a spec carries: a string or node as given, a spec's `reason`. */
export function reasonText(spec?: ReactNode | ActionReasonSpec): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec) || typeof spec !== 'object') {
    return spec;
  }
  if (!('reason' in spec) || !spec.reason) {
    return null;
  }
  return spec.reason;
}

/** The sentence as the Explainer's one page; `''` when there is none, which opens no bubble. */
export function reasonPage(spec?: ReactNode | ActionReasonSpec): ExplainerPage {
  const sentence = reasonText(spec);
  if (typeof sentence === 'string' || isValidElement(sentence)) {
    return sentence;
  }
  return typeof sentence === 'number' ? String(sentence) : '';
}
