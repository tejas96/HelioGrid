import { COMPANY_SIGNUP, createTranslator } from '@heliogrid/i18n';
import { Button, DoorFrame, Text } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedLength } from '../support/token';

/**
 * The door's frame at the boards' two widths (`SCR-M01-01`, `SCR-M01-02`, each record's "375
 * vertical layout"): under the breakpoint the step header leads, the heading takes the phone's
 * `--fs-h2` role and the pinned action stays on screen while the column scrolls; at 1536 the step
 * header and the action join the task column beside the identity, and the heading is `--fs-h1`.
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

test.describe('at 375', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the step header leads, the heading and intro are the phone sizes, and the action stays on screen', async ({
    mount,
    page,
  }) => {
    const door = await mount(doorTree());
    const lead = door.getByTestId('lead');
    const heading = door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) });
    const action = door.getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) });

    const leadBox = await lead.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(leadBox?.y).toBeLessThan(headingBox?.y ?? 0);
    await expect(heading).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-h2')}px`);
    await expect(door.getByText(INTRO)).toHaveCSS(
      'font-size',
      `${await resolvedLength(page, '--fs-body')}px`,
    );

    const actionBox = await action.boundingBox();
    expect((actionBox?.y ?? Infinity) + (actionBox?.height ?? 0)).toBeLessThanOrEqual(812);
  });
});

test.describe('at 1536', () => {
  test.use({ viewport: { width: 1536, height: 960 } });

  test('the step header and the action sit in the task column beside the identity', async ({
    mount,
    page,
  }) => {
    const door = await mount(doorTree());
    const lead = await door.getByTestId('lead').boundingBox();
    const task = await door.getByTestId('task').boundingBox();
    const heading = door.getByRole('heading', { name: en.t(COMPANY_SIGNUP.joinTitle) });
    const action = await door
      .getByRole('button', { name: en.t(COMPANY_SIGNUP.createAnyway) })
      .boundingBox();

    await expect(heading).toHaveCSS('font-size', `${await resolvedLength(page, '--fs-h1')}px`);
    await expect(door.getByText(INTRO)).toHaveCSS(
      'font-size',
      `${await resolvedLength(page, '--fs-body-lg')}px`,
    );
    const headingBox = await heading.boundingBox();
    const identityRight = (headingBox?.x ?? 0) + (headingBox?.width ?? 0);
    expect(lead?.x).toBe(task?.x);
    expect(action?.x).toBe(task?.x);
    expect(task?.x).toBeGreaterThan(identityRight);
    expect(lead?.y).toBeLessThan(task?.y ?? 0);
    expect(action?.y).toBeGreaterThan(task?.y ?? 0);
  });
});
