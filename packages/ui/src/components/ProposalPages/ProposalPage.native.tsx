import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useBlockInk } from '../ProposalBlocks/block-ink.native';
import {
  ProposalBankBlock,
  ProposalEmiBlock,
  ProposalGenerationBlock,
  ProposalPartsBlock,
  ProposalPriceBlock,
  ProposalSavingsBlock,
  ProposalSplitBlock,
  ProposalTermsBlock,
  ProposalTimelineBlock,
  ProposalTrackRecordBlock,
} from '../ProposalBlocks/ProposalBlocks.native';
import { PICTURE_INK, ProposalPicture } from '../ProposalPicture/ProposalPicture.native';
import { CoverPage } from './CoverPage.native';
import { PageSheet } from './PageSheet.native';
import { fittedPage, sheetPlace } from './ProposalPages.logic';
import { pageFrame, paperBlock, priceSheetOf } from './ProposalPages.plan';
import {
  type AnyProposalPageProps,
  PROPOSAL_PAGE_SIZE,
  type ProposalPageProps,
  type ScaledProposalPageProps,
} from './ProposalPages.types';

const display = theme.type.families.display;

function AboutBody(props: ProposalPageProps) {
  return (
    <>
      <View style={styles.collage}>
        <ProposalPicture name="site" style={styles.collageTall} />
        <View style={styles.collageSide}>
          <ProposalPicture name="roof" style={styles.collageSmall} />
          <ProposalPicture name="dusk" style={styles.collageSmall} />
        </View>
      </View>
      <ProposalTrackRecordBlock {...paperBlock.record(props)} />
    </>
  );
}

function Included({ words }: Pick<ProposalPageProps, 'words'>) {
  const ink = useBlockInk('paper');
  return (
    <View>
      <Text variant="overline" style={{ color: ink.tertiary }}>
        {words.included}
      </Text>
      <View style={styles.included}>
        {words.includedLines.map((line) => (
          <View key={line} style={styles.includedLine}>
            <View style={[styles.tick, { backgroundColor: ink.successBg }]} />
            <Text variant="body-sm" style={[styles.includedWords, { color: ink.text }]}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PriceBody(props: ProposalPageProps) {
  const sheet = priceSheetOf(props.snapshot, props.part ?? 0);
  const split = paperBlock.split(props);
  const emi = paperBlock.emi(props);
  return (
    <>
      {sheet.price ? <ProposalPriceBlock {...paperBlock.price(props)} /> : null}
      {split && <ProposalSplitBlock {...split} />}
      {emi && <ProposalEmiBlock {...emi} />}
      {!sheet.included || props.words.includedLines.length === 0 ? null : (
        <Included words={props.words} />
      )}
    </>
  );
}

function BankBody(props: ProposalPageProps) {
  const { words } = props;
  const ink = useBlockInk('paper');
  const bank = paperBlock.bank(props);
  return (
    <>
      {bank === null ? (
        <Text variant="body" style={[styles.absent, { color: ink.secondary }]}>
          {words.bankAbsent}
        </Text>
      ) : (
        <ProposalBankBlock {...bank} />
      )}
      <ProposalPicture name="evening" shade="foot" style={styles.close}>
        <View style={styles.closeWords}>
          <Text variant="display" style={styles.thanks}>
            {words.thanks}
          </Text>
          {words.questions === undefined ? null : (
            <Text variant="body-sm" style={styles.questions}>
              {words.questions}
            </Text>
          )}
        </View>
      </ProposalPicture>
    </>
  );
}

/** A page's body by its name; a page with one block draws it over the plan's facts. */
const BODY = {
  about: AboutBody,
  price: PriceBody,
  bank: BankBody,
  system: (props: ProposalPageProps) => <ProposalPartsBlock {...paperBlock.parts(props)} />,
  generation: (props: ProposalPageProps) => {
    const generation = paperBlock.generation(props);
    return generation && <ProposalGenerationBlock {...generation} />;
  },
  savings: (props: ProposalPageProps) => {
    const savings = paperBlock.savings(props);
    return savings && <ProposalSavingsBlock {...savings} />;
  },
  timeline: (props: ProposalPageProps) => <ProposalTimelineBlock {...paperBlock.timeline(props)} />,
  terms: (props: ProposalPageProps) => <ProposalTermsBlock {...paperBlock.terms(props)} />,
};

/**
 * One page of the proposal document at its design size (794 × 1123), drawn from the blocks in their
 * `paper` reading over the version's own facts — the same parts the builder, the customer's page and
 * the PDF draw (`M06-50`, `F5-38`). The caller scales it (`ScaledProposalPage`).
 */
export function ProposalPage(props: AnyProposalPageProps) {
  if (props.page === 'cover') return <CoverPage {...props} />;
  const Body = BODY[props.page];
  return (
    <PageSheet {...props} {...pageFrame(props)}>
      <Body {...props} />
    </PageSheet>
  );
}

type NativeScaledProposalPageProps = ScaledProposalPageProps & { style?: StyleProp<ViewStyle> };

/**
 * A page fitted to a width — a thumbnail, a peek, a reader: drawn at its design size and scaled as
 * a whole, so every width shows the same page. It is a picture of the page, read as one image by
 * its page's name.
 *
 * WEB → RN MAPPING: RN scales about the CENTRE, so the top-left origin the web sets is restored by
 * the compensating translate, as `DocumentPreview` does.
 */
export function ScaledProposalPage({ width, style, ...page }: NativeScaledProposalPageProps) {
  const { scale, height } = fittedPage(width);
  const title = page.page === 'cover' ? page.words.titles.cover : page.words.titles[page.page];
  const { number, count } = sheetPlace(page);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={page.words.pageName(title, number, count)}
      style={[styles.fit, { width, height }, style]}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[
          styles.fitPage,
          {
            transform: [
              { translateX: -(PROPOSAL_PAGE_SIZE.width * (1 - scale)) / 2 },
              { translateY: -(PROPOSAL_PAGE_SIZE.height * (1 - scale)) / 2 },
              { scale },
            ],
          },
        ]}
      >
        <ProposalPage {...page} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collage: { flexDirection: 'row', gap: 12, height: 312 },
  collageTall: { flex: 1.25, borderRadius: theme.radius['rf-xl'] },
  collageSide: { flex: 1, gap: 12 },
  collageSmall: { flex: 1, borderRadius: theme.radius['rf-xl'] },
  included: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', columnGap: 24, rowGap: 10 },
  includedLine: { width: '47%', flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tick: { marginTop: 3, width: 16, height: 16, borderRadius: theme.radius['rf-xl'] },
  includedWords: { flex: 1, fontSize: theme.type.document['doc-fs'], lineHeight: 22 },
  absent: { fontSize: theme.type.document['doc-fs-lead'], lineHeight: 26 },
  close: { marginTop: 'auto', height: 240, borderRadius: theme.radius['r-lg'] },
  closeWords: { marginTop: 'auto', paddingHorizontal: 28, paddingBottom: 24, gap: 4 },
  thanks: {
    fontFamily: display,
    fontWeight: '400',
    fontSize: theme.type.document['doc-fs-stat'],
    lineHeight: 40,
    color: PICTURE_INK,
  },
  questions: { fontSize: theme.type.document['doc-fs'], lineHeight: 22, color: PICTURE_INK },
  fit: {
    overflow: 'hidden',
    borderRadius: theme.radius['rf-sm'],
    backgroundColor: theme.palettes.light.surface,
    ...theme.elevation.e3,
  },
  fitPage: { width: PROPOSAL_PAGE_SIZE.width, height: PROPOSAL_PAGE_SIZE.height },
});
