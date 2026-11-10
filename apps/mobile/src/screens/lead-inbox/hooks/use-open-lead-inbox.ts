import { useNavigation } from '@react-navigation/native';

/** The way into the inbox from the Leads screen or a badge that counts it (`SCR-M02-02`). */
export function useOpenLeadInbox(): () => void {
  const navigation = useNavigation();
  return () => navigation.navigate('LeadInbox');
}
