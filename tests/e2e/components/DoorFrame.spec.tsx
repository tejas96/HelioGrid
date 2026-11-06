import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { Button, type DoorColumn, DoorFrame, Text } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import type { Page } from '@playwright/test';
import { settledBox } from '../support/layout';
import { resolvedLength } from '../support/token';

/**
 * The door's frame: one centred column at every width — the step header leads, then the heading,
 * the task and the action, which stays on screen while a phone's column scrolls. `column` places
 * the heading on a phone: centred between the header row and the column's foot, or `sp-8` under
 * the step header.
 */
const en = await createTranslator('en');

/** The identity's intro, sized with the heading by width. */
const INTRO = en.t(COMPANY_SIGNUP.sentBody, { company: 'Suryodaya Solar', city: 'Pune' });

/** A task taller than any phone, so the column must scroll under the pinned action. */
const TALL_TASK = 1600;

/** One door: a step header, a heading, a task taller than the phone and a pinned action. */
function doorTree() {
  return (
    <DoorFrame
      trailing={<span />}
      taskMeasure="steps"
      lead={
        <div data-testid="lead">
          <Text>{en.t(COMPANY_SIGNUP.stepYourCompany)}</Text>
        </div>
      }
      identity={
        <>
          <Text variant="h1">{en.t(COMPANY_SIGNUP.joinTitle)}</Text>
          <Text variant="body-lg">{INTRO}</Text>
        </>
      }
      footer={
        <Button variant="secondary" size="lg" fullWidth>
          {en.t(COMPANY_SIGNUP.createAnyway)}
        </Button>
      }
    >
      <div data-testid="task" style={{ height: TALL_TASK }} />
    </DoorFrame>
  );
}

/** A task far shorter than the phone, so the column has free height to place. */
const SHORT_TASK = 120;

/** One door with a short task: its heading placed by `column`, under a step header when it has one. */
function placedDoor(column: DoorColumn, withLead: boolean) {
  return (
    <DoorFrame
      trailing={<span />}
      column={column}
      lead={
        withLead ? (
          <div data-testid="lead">
            <Text>{en.t(COMPANY_SIGNUP.stepYourCompany)}</Text>
          </div>
        ) : undefined
      }
      identity={<Text variant="h1">{en.t(COMPANY_SIGNUP.joinTitle)}</Text>}
    >
      <div data-testid="task" style={{ height: SHORT_TASK }} />
    </DoorFrame>
  );
}

/**
 * Waits for the web fonts: a heading measured in the fallback face sits a pixel off where the
 * loaded face puts it, which a busy run catches before the face arrives.
 */
async function settledType(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a centred column leaves as much room above its heading as under its task', async ({
    mount,
    page,
  }) => {
    const door = await mount(placedDoor('centred', false));
    await settledType(page);
    const header = await settledBox(door.locator('header'));
    const heading = await settledBox(
      door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) }),
    );
    const task = await settledBox(door.getByTestId('task'));

    const above = (heading?.y ?? 0) - ((header?.y ?? 0) + (header?.height ?? 0));
    const under = 812 - ((task?.y ?? 0) + (task?.height ?? 0));
    expect(above).toBeGreaterThan(await resolvedLength(page, '--sp-8'));
    expect(Math.abs(above - under)).toBeLessThanOrEqual(1);
  });

  test('a deep column puts its heading sp-8 under the step header', async ({ mount, page }) => {
    const door = await mount(placedDoor('deep', true));
    await settledType(page);
    const lead = await settledBox(door.getByTestId('lead'));
    const heading = await settledBox(
      door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) }),
    );

    const gap = (heading?.y ?? 0) - ((lead?.y ?? 0) + (lead?.height ?? 0));
    expect(gap).toBe(await resolvedLength(page, '--sp-8'));
  });

  test('a near column puts its heading sp-4 under the step header', async ({ mount, page }) => {
    const door = await mount(placedDoor('near', true));
    await settledType(page);
    const lead = await settledBox(door.getByTestId('lead'));
    const heading = await settledBox(
      door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) }),
    );

    const gap = (heading?.y ?? 0) - ((lead?.y ?? 0) + (lead?.height ?? 0));
    expect(gap).toBe(await resolvedLength(page, '--sp-4'));
  });

  test('the step header leads, the heading keeps its role, and the action stays on screen', async ({
    mount,
    page,
  }) => {
    const door = await mount(doorTree());
    const lead = door.getByTestId('lead');
    const heading = door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) });
    const action = door.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) });

    const leadBox = await settledBox(lead);
    const headingBox = await settledBox(heading);
    expect(leadBox?.y).toBeLessThan(headingBox?.y ?? 0);
    /* The frame never resizes what it holds: a title keeps its own role at every width. */
    await expect(heading).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-h1')}px`);
    await expect(door.getByText(INTRO)).toHaveCSS(
      'font-size',
      `${await resolvedLength(page, '--fs-body-lg')}px`,
    );

    const actionBox = await settledBox(action);
    expect((actionBox?.y ?? Infinity) + (actionBox?.height ?? 0)).toBeLessThanOrEqual(812);
  });
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('the door is one centred column: the step header, the heading, the task and the action in reading order', async ({
    mount,
    page,
  }) => {
    const door = await mount(doorTree());
    const lead = await settledBox(door.getByTestId('lead'));
    const task = await settledBox(door.getByTestId('task'));
    const heading = door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) });
    const action = await settledBox(
      door.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) }),
    );
    const formMax = await resolvedLength(page, '--form-max');

    await expect(door.getByText(INTRO)).toHaveCSS(
      'font-size',
      `${await resolvedLength(page, '--fs-body-lg')}px`,
    );
    const headingBox = await settledBox(heading);
    expect(lead?.x).toBe(task?.x);
    expect(headingBox?.x).toBe(task?.x);
    expect(action?.x).toBe(task?.x);
    expect(task?.width).toBeLessThanOrEqual(formMax);
    /* Centred: as much room on the window's left as on its right. */
    expect(Math.abs((task?.x ?? 0) * 2 + (task?.width ?? 0) - 1536)).toBeLessThanOrEqual(1);
    expect(lead?.y).toBeLessThan(headingBox?.y ?? 0);
    expect(headingBox?.y).toBeLessThan(task?.y ?? 0);
    expect(action?.y).toBeGreaterThan(task?.y ?? 0);
  });
});

test.describe('the held action at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('tells its own height, so a toast can stand clear of it', async ({ mount }) => {
    const heights: number[] = [];
    const door = await mount(
      <DoorFrame
        identity={<Text variant="h1">{en.t(COMPANY_SIGNUP.joinTitle)}</Text>}
        footer={
          <Button variant="primary" size="lg" fullWidth>
            {en.t(COMPANY_SIGNUP.createAnyway)}
          </Button>
        }
        onFooterHeight={(height) => heights.push(height)}
      >
        <div data-testid="task" style={{ height: SHORT_TASK }} />
      </DoorFrame>,
    );
    const footer = await settledBox(door.locator('.hg-door-footer'));
    await expect.poll(() => heights.at(-1)).toBe(footer?.height);
  });
});
