import type { ProposalPage } from '@heliogrid/domain';
import { expect, test } from '@playwright/experimental-ct-react';
import { SNAPSHOT } from '../support/proposal-document-sample';
import { PageAsPrinted } from './ProposalPages.story';

/**
 * `T-M06-017` (`F7-07`, `F5-81`): a company's brand dresses its document and changes no number,
 * label or disclosure — every page's text layer, under a brand colour that fails contrast, equals
 * the unbranded page's.
 */
const PAGE_WIDTH = 794;
/** A light yellow no ink passes contrast on: the document must take its derived shade instead. */
const FAILING_BRAND = '#FFE14D';

for (const page of SNAPSHOT.pages as readonly ProposalPage[]) {
  test(`the ${page} page reads the same words branded and unbranded`, async ({ mount }) => {
    const plain = await mount(<PageAsPrinted page={page} width={PAGE_WIDTH} brandColour={null} />);
    const unbranded = await plain.innerText();
    await plain.unmount();
    const branded = await mount(
      <PageAsPrinted page={page} width={PAGE_WIDTH} brandColour={FAILING_BRAND} />,
    );
    expect(unbranded.trim()).not.toBe('');
    expect(await branded.innerText()).toBe(unbranded);
  });
}
