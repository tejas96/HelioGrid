import { useNavigation } from '@react-navigation/native';
import { useOpenLeadInbox } from '../../lead-inbox';
import { doorRoute } from '../../shell/doors';

/** Where the Leads list goes on the phone: quick add, the import, the inbox and one lead. */
export interface LeadsListMoves {
  add: () => void;
  import: () => void;
  inbox: () => void;
  open: (leadId: string) => void;
}

export function useLeadsListMoves(): LeadsListMoves {
  const navigation = useNavigation();
  return {
    add: () => navigation.navigate(doorRoute.add_lead),
    import: () => navigation.navigate('LeadImport'),
    inbox: useOpenLeadInbox(),
    open: (leadId) => navigation.navigate('LeadDetail', { leadId }),
  };
}
