import {
  type DesignDocumentWire,
  IDEMPOTENCY_KEY_HEADER,
  type SaveDocument,
} from '@heliogrid/contracts';
import { EMPTY_STUDIO_DOCUMENT } from '@heliogrid/domain';
import { createTranslator, studioCanvasWords } from '@heliogrid/i18n';
import { expect, type Page, test } from '@playwright/test';
import { API } from '../support/api-log';
import { expectNoSeriousViolations } from '../support/axe';
import { expectNoSidewaysScroll, settledBox } from '../support/layout';
import { captureLead, ownerWithCompany } from '../support/project';
import { saveSiteThroughApi, startDesignThroughApi, withoutMapService } from '../support/studio';

/**
 * The roof step (`T-M05-002`, part b) on `/designs/<id>`: a roof drawn and sized in seven taps,
 * then fixed on the model — a corner dragged into the magnet, a corner added with + and removed
 * with ×, a drag that would cross the edges going back — in the top view and in 3D; a reader of a
 * closed lead sees the roof with no controls, and a reader in feet reads feet. The map service is
 * held off, so the studio draws on its grid: every tap lands where the test puts it.
 */
const en = await createTranslator('en');
const STUDIO = studioCanvasWords(en.t);
/** The sentences the bar says, with lengths shown as the test reads them. */
const SHOWN = { length: String, height: '' };
/** How far from the middle of the map, in CSS pixels, the test's corners are tapped. */
const ACROSS_PX = 100;
const DOWN_PX = 70;
/** A rectangle saved through the api: 8 m by 6 m round the pin, its first edge typed. Corner 4,
 * dragged level with the middle and past corner 3, makes a bow: its edges would cross. */
const RECTANGLE = [
  { east: -4, north: 3 },
  { east: 4, north: 3 },
  { east: 4, north: -3 },
  { east: -4, north: -3 },
];
/** The true length typed, as a share of the traced one: within the quarter that asks. */
const TRUE_SHARE = 1.1;
const NUDGE_PX = 6;
const SAVES_SO_FAR = 4;
const DRAG_3D_PX = 40;

/** No sky picture: the studio draws on its grid, the same on every machine. */
async function onTheGrid(page: Page): Promise<void> {
  await withoutMapService(page);
  await page.route('**/designs/*/sky-tiles', (route) => route.abort());
}

/** The middle of the map, where the camera opens on the pin. */
async function mapMiddle(page: Page): Promise<{ x: number; y: number }> {
  const box = await settledBox(page.getByRole('application', { name: STUDIO.mapKeys }));
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Where a control on the model is now, in page pixels. */
async function middleOf(page: Page, name: string): Promise<{ x: number; y: number }> {
  const box = await settledBox(page.getByRole('button', { name, exact: true }));
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2);
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
}

async function documentOf(page: Page, designId: string): Promise<DesignDocumentWire> {
  const answer = await page.request.get(`${API}/designs/${designId}/document`);
  expect(answer.status()).toBe(200);
  return (await answer.json()) as DesignDocumentWire;
}

/** A design with its site and one 8 m by 6 m roof, saved as the studio saves it. */
async function aDesignWithARoof(page: Page): Promise<{ designId: string; leadId: string }> {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);
  await saveSiteThroughApi(page, design.id);
  const body: SaveDocument = {
    baseVersion: 0,
    opening: crypto.randomUUID(),
    document: {
      ...EMPTY_STUDIO_DOCUMENT,
      roofs: [
        {
          id: crypto.randomUUID(),
          corners: RECTANGLE,
          edges: ['typed', 'traced', 'traced', 'traced'],
          tracedOn: 'none',
        },
      ],
      pictureScale: 1,
    },
  };
  const saved = await page.request.put(`${API}/designs/${design.id}/document`, { data: body });
  expect(saved.status()).toBe(200);
  return { designId: design.id, leadId };
}

test('a roof is drawn and sized in seven taps: three corners, close, one length, Continue', async ({
  page,
}) => {
  await ownerWithCompany(page, en);
  const leadId = await captureLead(page);
  const { design } = await startDesignThroughApi(page, leadId);
  await onTheGrid(page);
  await saveSiteThroughApi(page, design.id);
  await page.goto(`/designs/${design.id}`);
  await page.getByRole('button', { name: STUDIO.drawOnGrid }).click();
  await expect(page.getByText(STUDIO.drawTitle(0, false))).toBeVisible();
  await expectNoSeriousViolations(page);

  let taps = 0;
  const tap = async (x: number, y: number) => {
    taps += 1;
    await page.mouse.click(x, y);
  };
  const middle = await mapMiddle(page);
  await tap(middle.x - ACROSS_PX, middle.y - DOWN_PX);
  await tap(middle.x + ACROSS_PX, middle.y - DOWN_PX);
  await tap(middle.x + ACROSS_PX, middle.y + DOWN_PX);
  /* Three square corners: the fourth is offered, and Close shape uses it. */
  await expect(page.getByText(STUDIO.drawTitle(3, true))).toBeVisible();
  taps += 1;
  await page.getByRole('button', { name: STUDIO.closeShape }).click();
  await expect(page.getByRole('button', { name: STUDIO.seeIn3d })).toBeVisible();

  /* One true length sizes the whole roof. */
  const firstEdge = STUDIO.edgeLength(1, '\u0000').split('\u0000')[0] ?? '';
  taps += 1;
  await page.getByRole('button', { name: new RegExp(`^${firstEdge}`) }).click();
  // The true length, a little off the traced one the box opens with: near enough not to ask.
  const box = page.getByRole('spinbutton', { name: STUDIO.lengthLabel });
  const traced = Number(await box.inputValue());
  await box.fill((traced * TRUE_SHARE).toFixed(2));
  taps += 1;
  await page.keyboard.press('Enter');
  await expect(page.getByText(STUDIO.roofLine({ kind: 'sized' }, false, SHOWN))).toBeVisible();
  taps += 1;
  await page.getByRole('button', { name: STUDIO.addObjects }).click();
  await expect(page.getByText(STUDIO.objectsComing)).toBeVisible();
  expect(taps).toBe(7);

  // The roof and its length are saved: the document's first edge is typed.
  await expect
    .poll(async () => (await documentOf(page, design.id)).document.roofs[0]?.edges[0])
    .toBe('typed');
  const { document } = await documentOf(page, design.id);
  const [roof] = document.roofs;
  expect(document.roofs).toHaveLength(1);
  expect(roof?.corners).toHaveLength(4);
  expect(roof?.edges).toEqual(['typed', 'traced', 'traced', 'traced']);
  expect(document.pictureScale).not.toBe(1);
  await expectNoSidewaysScroll(page);
});

test('a roof is fixed on the model: the magnet, +, ×, a drag that goes back, and 3D', async ({
  page,
}) => {
  const { designId } = await aDesignWithARoof(page);
  await onTheGrid(page);
  await page.goto(`/designs/${designId}`);
  await expect(page.getByRole('button', { name: STUDIO.cornerName(3), exact: true })).toBeVisible();
  await expectNoSeriousViolations(page);

  /* A corner nudged near its square place snaps back to it, and the bar names the magnet. */
  const third = await middleOf(page, STUDIO.cornerName(3));
  await drag(page, third, { x: third.x + NUDGE_PX, y: third.y + NUDGE_PX });
  const squared = { kind: 'corner_moved', snap: { kind: 'square_corner' } } as const;
  await expect(page.getByText(STUDIO.roofLine(squared, false, SHOWN))).toBeVisible();

  /* + adds a corner on an edge; picked, × removes it again. */
  await page.getByRole('button', { name: STUDIO.cornerAdd }).first().click();
  await expect(page.getByRole('button', { name: STUDIO.cornerName(5), exact: true })).toBeVisible();
  await page.getByRole('button', { name: STUDIO.cornerName(2), exact: true }).click();
  await page.getByRole('button', { name: STUDIO.cornerRemove(2) }).click();
  await expect(
    page.getByText(STUDIO.roofLine({ kind: 'corner_removed' }, false, SHOWN)),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: STUDIO.cornerName(5), exact: true })).toHaveCount(
    0,
  );

  /* A drag that would cross the edges goes back, and the bar says why. */
  // Saved so far: the roof itself, then the magnet's move, the + and the × — one version each.
  await expect.poll(async () => (await documentOf(page, designId)).version).toBe(SAVES_SO_FAR);
  const before = await documentOf(page, designId);
  const first = await middleOf(page, STUDIO.cornerName(1));
  const across = await middleOf(page, STUDIO.cornerName(3));
  await drag(page, await middleOf(page, STUDIO.cornerName(4)), {
    x: across.x + (across.x - first.x) / 2,
    y: (first.y + across.y) / 2,
  });
  const back = { kind: 'went_back', fault: 'would_cross' } as const;
  await expect(page.getByText(STUDIO.roofLine(back, false, SHOWN))).toBeVisible();
  expect((await documentOf(page, designId)).version).toBe(before.version);

  /* In 3D a corner drags along the ground, as in the top view. */
  await page.getByRole('button', { name: STUDIO.threeDView }).click();
  const corner = await middleOf(page, STUDIO.cornerName(2));
  await drag(page, corner, { x: corner.x + DRAG_3D_PX, y: corner.y + DRAG_3D_PX });
  await expect
    .poll(async () => (await documentOf(page, designId)).version)
    .toBeGreaterThan(before.version);
  await expectNoSidewaysScroll(page);
});

test('a closed lead shows its roof view only; a reader in feet reads feet', async ({ page }) => {
  const { designId, leadId } = await aDesignWithARoof(page);
  await onTheGrid(page);

  /* Feet, picked in the view menu, follow the reader to every length. */
  await page.goto(`/designs/${designId}`);
  await page.getByRole('button', { name: STUDIO.view, exact: true }).first().click();
  await page.getByRole('menuitemradio', { name: STUDIO.feet }).click();
  await expect(page.getByRole('button', { name: /ft/ }).first()).toBeVisible();

  const lost = await page.request.post(`${API}/leads/${leadId}/lost`, {
    data: { reason: 'price', capturedAt: new Date().toISOString() },
    headers: { [IDEMPOTENCY_KEY_HEADER]: crypto.randomUUID() },
  });
  expect(lost.status()).toBe(200);
  await page.goto(`/designs/${designId}`);
  await expect(page.getByText(STUDIO.viewOnly)).toBeVisible();
  await expect(page.getByRole('button', { name: STUDIO.cornerName(1), exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: STUDIO.drawRoof })).toHaveCount(0);
  await expect(page.getByText(/ft/).first()).toBeVisible();
  await expectNoSeriousViolations(page);
});
