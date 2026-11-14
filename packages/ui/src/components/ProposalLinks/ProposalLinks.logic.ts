import type { CustomerLink, CustomerLinks } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { NewLinkSheetProps, ProposalLinkAct, ProposalLinksProps } from './ProposalLinks.types';

/** The acts a live link offers, in the order drawn; a link that is off offers none. */
export const LINK_ACTS: readonly {
  readonly act: ProposalLinkAct;
  readonly glyph: ShellGlyphName;
}[] = [
  { act: 'copy', glyph: 'clipboard' },
  { act: 'remint', glyph: 'retry' },
  { act: 'revoke', glyph: 'link-off' },
];

/** The value the "who is it for" choice holds for nobody named. */
export const NOBODY = '';

/** The longest a link's own name may be — the wire's limit (`mintLinkSchema`). */
export const LINK_LABEL_MAX = 80;

/** A live link's acts as both halves draw them: Revoke only for a reader who may. */
export function linkActsOf(props: ProposalLinksProps, link: CustomerLink, mayRevoke: boolean) {
  const press: Record<ProposalLinkAct, () => void> = {
    copy: () => props.onCopy(link.id),
    remint: () => props.onRemint(link.id),
    revoke: () => props.onAskRevoke(link.id),
  };
  return LINK_ACTS.filter((each) => each.act !== 'revoke' || mayRevoke).map((each) => ({
    key: each.act,
    glyph: each.glyph,
    button: {
      label: props.words.act(each.act, link.label),
      variant: 'surface' as const,
      disabled: props.pending !== null,
      onClick: press[each.act],
    },
  }));
}

/** The ask before a link is switched off: its sheet, and its two answers — inert while it sends. */
export function revokeConfirmOf(props: ProposalLinksProps, links: CustomerLinks['links']) {
  const { words } = props;
  const link = links.find((each) => each.id === props.confirming);
  const sending = props.pending?.act === 'revoke';
  const big = { size: 'lg' as const, fullWidth: true };
  return {
    link,
    sheet: {
      open: link !== undefined,
      onClose: () => {
        if (!sending) props.onCancelRevoke();
      },
      closeLabel: words.close,
      title: link === undefined ? undefined : words.confirmTitle(link.label),
      dismissible: !sending,
    },
    yes: {
      ...big,
      variant: 'destructive' as const,
      loading: sending,
      onClick: () => {
        if (link !== undefined) props.onRevoke(link.id);
      },
    },
    no: { ...big, variant: 'secondary' as const, disabled: sending, onClick: props.onCancelRevoke },
  };
}

/**
 * The New link form on both halves: its sheet, who it is for, the link's own name — which must
 * hold something once Make was pressed — and the act, all inert while it sends.
 */
export function newLinkFormOf(props: NewLinkSheetProps, tried: boolean) {
  const { words, contacts, draft, sending } = props;
  const missing = draft.label.trim() === '';
  return {
    missing,
    sheet: {
      open: props.open,
      onClose: () => {
        if (!sending) props.onClose();
      },
      closeLabel: words.close,
      title: words.title,
      dismissible: !sending,
    },
    who: {
      label: words.who,
      placeholder: words.whoPlaceholder,
      closeLabel: words.close,
      disabled: sending,
      value: draft.contactId ?? NOBODY,
      options: [
        ...contacts.map((contact) => ({ value: contact.id, label: contact.name })),
        { value: NOBODY, label: words.nobody },
      ],
      onChange: (value: string) =>
        props.onChange({ ...draft, contactId: value === NOBODY ? null : value }),
    },
    label: {
      label: words.label,
      helper: words.labelHelper,
      error: tried && missing ? words.labelNeeded : undefined,
      disabled: sending,
      value: draft.label,
      maxLength: LINK_LABEL_MAX,
      onChange: (label: string) => props.onChange({ ...draft, label }),
    },
    make: { variant: 'primary' as const, size: 'lg' as const, fullWidth: true, loading: sending },
  };
}
