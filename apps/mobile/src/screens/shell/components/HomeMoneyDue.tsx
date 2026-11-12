import { useMoneyDue, useOwnerDashboard } from '@heliogrid/data/react';
import { moneyDueWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { MoneyDue } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';

/**
 * Money due on the home (`SCR-M11-01`): Finance's home — the total to collect in the hero, then the
 * parts late, due today and part paid — and on the owner's, under the dashboard that already holds
 * the cash, the parts alone; a row opens that project's payments, and
 * *Remind* opens its collect sheet. A home without it draws nothing and reads nothing.
 */
export function HomeMoneyDue() {
  const t = useTranslate();
  const navigation = useNavigation();
  const due = useMoneyDue();
  const ownerShown = useOwnerDashboard().shown;
  const frame = useRef<View>(null);
  if (!due.shown) return null;
  return (
    <View ref={frame}>
      <MoneyDue
        read={due.read}
        words={moneyDueWords(t)}
        groups={due.groups}
        onShowAll={due.expand}
        onOpen={(projectId) => navigation.navigate('ProjectPayments', { projectId })}
        onRemind={(projectId, collect) =>
          navigation.navigate('ProjectPayments', { projectId, collect })
        }
        focusAfter={frame}
        figures={ownerShown ? 'none' : 'hero'}
      />
    </View>
  );
}
