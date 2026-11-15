import type { ProposalWithdrawSheetProps } from './ProposalWithdrawSheet.types';

/** The Withdraw sheet's frame and its one act on both halves: no way out while it sends. */
export function withdrawSheetOf(props: ProposalWithdrawSheetProps) {
  const { words, sending } = props;
  return {
    sheet: {
      open: props.open && words !== null,
      onClose: () => {
        if (!sending) props.onClose();
      },
      closeLabel: props.close,
      title: words?.title,
      dismissible: !sending,
    },
    confirm: {
      variant: 'destructive' as const,
      size: 'lg' as const,
      fullWidth: true,
      loading: sending,
      onClick: props.onConfirm,
    },
  };
}
