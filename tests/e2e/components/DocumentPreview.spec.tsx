import { COMPANY_LOGO_LIMITS, compliantShades, hexToRgb } from '@heliogrid/domain';
import { brandingWords, createTranslator } from '@heliogrid/i18n';
import { DocumentPreview } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour, resolvedFont } from '../support/token';

/**
 * A real tenant's cover (`SCR-M01-18`, `sample={false}`): it prints only what it is passed, its
 * words take the ink the server derives from the brand colour (`compliantShades`, D250), a cover
 * with no logo carries the company name alone, and the tax number and the phone print in the mono
 * face with tabular figures (`F7-09`, D273).
 */
const en = await createTranslator('en');

/* Tenant data, as a company types it — never a word of the product's. */
const COMPANY = 'Suryodaya Solar Pvt Ltd';
const ADDRESS = 'Shop 14, Laxmi Complex, Baner Road, Pune 411045';
const TAX_ID = '27AABCS1429P1ZQ';
const PHONE = '+91 98200 41123';
const LINES = ['+91 98200 41123', 'suryodayasolar.in'];
/* A brand yellow no word can sit in: its ink is a darker shade of the same hue (s18-n). */
const PALE_BRAND = '#F2C200';
/* A brand green white reads on (m18-b). */
const DARK_BRAND = '#0D7A4F';
/* The platform's near-black: the colour of a company that never set one (s18-k). */
const PLATFORM = '#0A0A0B';

/* Only the cover's title word is read; the other facts fill the signature. */
const words = brandingWords(en.t, {
  limits: COMPANY_LOGO_LIMITS,
  companyName: COMPANY,
  taxLabel: '',
});

function rgbOf(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

test('the cover prints in the derived ink', async ({ mount, page }) => {
  const { ink } = compliantShades(PALE_BRAND);
  expect(ink).not.toBe(PALE_BRAND);
  const pale = await mount(
    <DocumentPreview
      sample={false}
      parts={['cover']}
      brandColor={PALE_BRAND}
      companyName={COMPANY}
      docTitle={words.proposal}
      width={480}
      caption=""
    />,
  );
  await expect(pale.locator('.hg-doc-title')).toHaveText(words.proposal);
  await expect(pale.locator('.hg-doc-title')).toHaveCSS('color', rgbOf(ink));
  /* No white can sit on the yellow, so the band's words are near-black on the fill. */
  await expect(pale.locator('.hg-doc-company')).toHaveCSS(
    'color',
    await resolvedColour(page, '--text-primary'),
  );
  await pale.unmount();

  const dark = await mount(
    <DocumentPreview
      sample={false}
      parts={['cover']}
      brandColor={DARK_BRAND}
      companyName={COMPANY}
      docTitle={words.proposal}
      width={480}
      caption=""
    />,
  );
  await expect(dark.locator('.hg-doc-title')).toHaveCSS(
    'color',
    rgbOf(compliantShades(DARK_BRAND).ink),
  );
  await expect(dark.locator('.hg-doc-company')).toHaveCSS(
    'color',
    await resolvedColour(page, '--text-inverse'),
  );
});

test('an empty cover shows the company name alone', async ({ mount }) => {
  const sheet = await mount(
    <DocumentPreview
      sample={false}
      parts={['cover']}
      brandColor={PLATFORM}
      companyName={COMPANY}
      address={ADDRESS}
      letterhead={{}}
      width={480}
      caption=""
    />,
  );
  const band = sheet.locator('.hg-doc-band');
  await expect(band.locator('.hg-doc-company')).toHaveText(COMPANY);
  await expect(band.locator('img')).toHaveCount(0);
  await expect(band.locator('.hg-doc-slot')).toHaveCount(0);
  await expect(band.locator('.hg-doc-tagline')).toHaveCount(0);
  /* Nothing of the sample: no recipient, no number, no money band, no caption. */
  await expect(sheet.locator('.hg-doc-cover')).toHaveCount(0);
  await expect(sheet.locator('.hg-doc-total-row')).toHaveCount(0);
  await expect(sheet.locator('figcaption')).toHaveCount(0);
  await expect(sheet.locator('.hg-doc-sheet')).toHaveText(`${COMPANY}${ADDRESS}`);
});

test('the tax line and the footer phone are mono', async ({ mount, page }) => {
  const sheet = await mount(
    <DocumentPreview
      sample={false}
      parts={['cover']}
      brandColor={DARK_BRAND}
      companyName={COMPANY}
      taxId={TAX_ID}
      phone={PHONE}
      letterhead={{ lines: LINES }}
      width={480}
      caption=""
    />,
  );
  const mono = await resolvedFont(page, 'fontFamily', '--font-mono');
  const sans = await resolvedFont(page, 'fontFamily', '--font-sans');

  /* The band: the tax number first, then the company's own lines as typed, in the document's face. */
  const line = sheet.locator('.hg-doc-lines');
  await expect(line).toContainText(`${TAX_ID} · ${LINES.join(' · ')}`);
  await expect(line).toHaveCSS('font-family', sans);
  const bandNumber = line.locator('.hg-doc-figure');
  await expect(bandNumber).toHaveText(TAX_ID);
  await expect(bandNumber).toHaveCSS('font-family', mono);
  await expect(bandNumber).toHaveCSS('font-variant-numeric', 'tabular-nums');

  /* The foot: the tax number the same way, and the phone in mono. */
  const figures = sheet.locator('.hg-doc-footer .hg-doc-figure');
  await expect(figures).toHaveText([TAX_ID, PHONE]);
  for (const figure of await figures.all()) {
    await expect(figure).toHaveCSS('font-family', mono);
    await expect(figure).toHaveCSS('font-variant-numeric', 'tabular-nums');
  }
});
