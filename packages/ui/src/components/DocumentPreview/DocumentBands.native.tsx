import { View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { DocumentOverline, DocumentRule, docStyles } from './DocumentSheet.native';
import type { ResolvedDocument } from './document-model';

/**
 * The document's bands, in document order. Each band drawn is the REAL one — a tranche schedule
 * is the schedule, never `[description, amount]` line items pretending to be one.
 *
 * WEB → RN MAPPING: the web half draws these as `<table>` rows. RN has no table, so each row is
 * a flex row with the same column widths and the same right-aligned tabular figures.
 */

export function DocumentItemsBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <View>
      <DocumentRule colour={doc.brandHex} opaque={doc.ruleOpaque} />
      <View style={docStyles.rowFirst}>
        {doc.lineItems.map((item) => (
          <View key={item.description} style={docStyles.row}>
            <Text style={docStyles.cell}>{item.description}</Text>
            <Text style={docStyles.amount}>{item.amountText}</Text>
          </View>
        ))}
      </View>
      <View style={docStyles.totalRow}>
        <Text style={docStyles.totalLabel}>Total</Text>
        <Text style={[docStyles.totalValue, { color: doc.ink }]}>{doc.totalText}</Text>
      </View>
      {doc.subsidyLine === null ? null : <Text style={docStyles.subsidy}>{doc.subsidyLine}</Text>}
    </View>
  );
}

/** `SCR-M01-19`'s included-sections list: what the template prints, in order. */
export function DocumentSectionsBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <View>
      <DocumentRule colour={doc.brandHex} opaque={doc.ruleOpaque} />
      <DocumentOverline spaced>{doc.sectionsTitle}</DocumentOverline>
      <View style={docStyles.sectionList}>
        {doc.sections.map((section, index) => (
          <View key={section.label} style={docStyles.sectionItem}>
            <Text style={docStyles.sectionIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={docStyles.sectionLabel}>{section.label}</Text>
            {section.meta === undefined ? null : (
              <Text style={docStyles.sectionMeta}>{section.meta}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/** `SCR-M01-20`'s tranche schedule, as the customer will see it. */
export function DocumentTranchesBand({ doc }: { doc: ResolvedDocument }) {
  return (
    <View>
      <DocumentRule colour={doc.brandHex} opaque={doc.ruleOpaque} />
      <DocumentOverline spaced>{doc.tranchesTitle}</DocumentOverline>
      <View>
        {doc.tranches.map((tranche, index) => (
          <View key={tranche.label} style={docStyles.trancheRow}>
            <Text style={docStyles.trancheIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={docStyles.trancheCell}>
              <Text style={docStyles.trancheLabel}>{tranche.label}</Text>
              {tranche.when === undefined ? null : (
                <Text style={docStyles.trancheWhen}>{tranche.when}</Text>
              )}
            </View>
            {tranche.share === undefined ? null : (
              <Text style={docStyles.trancheShare}>{tranche.share}</Text>
            )}
            <Text style={docStyles.trancheAmount}>{tranche.amountText}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
