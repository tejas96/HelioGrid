import { useNavigation } from '@react-navigation/native';
import { Linking, Share } from 'react-native';

/**
 * Lead Detail's ways out on the phone — the platform adapter: back to where it was opened from,
 * the leads list, the dialler, the system share sheet for a message to send from the person's own
 * apps, and quick add naming this lead as the referrer (`M02-16`).
 */
export function useLeadDetailMoves() {
  const navigation = useNavigation();
  return {
    back: () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('Leads');
    },
    toLeads: () => navigation.navigate('Leads'),
    dial: (phoneE164: string) => {
      void Linking.openURL(`tel:${phoneE164}`).catch(() => undefined);
    },
    /**
     * The share sheet holds Copy and the person's own apps — React Native's own clipboard has left
     * its core. `shared` runs once the text was handed on; a dismissed sheet hands nothing on.
     */
    share: (text: string, shared: () => void) => {
      void Share.share({ message: text }).then(
        (answer) => {
          if (answer.action === Share.sharedAction) shared();
        },
        () => undefined,
      );
    },
    addReferral: (leadId: string) => navigation.navigate('QuickAddLead', { referredBy: leadId }),
    /** Customer merge with this customer as the survivor, and the other record when known (`M02-63`). */
    merge: (survivorId: string, loserId?: string) =>
      navigation.navigate(
        'CustomerMerge',
        loserId === undefined ? { survivorId } : { survivorId, loserId },
      ),
  };
}

export type LeadDetailMoves = ReturnType<typeof useLeadDetailMoves>;
