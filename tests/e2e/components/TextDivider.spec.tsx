import { createTranslator, SIGN_IN } from '@heliogrid/i18n';
import { TextDivider } from '@heliogrid/ui';
import { expect, test } from '@playwright/experimental-ct-react';
import { resolvedColour } from '../support/token';

/** The "or" between Send code and Continue with Google (`SCR-M01-01`), in the phone's 375 and the desktop's 420 column. */
const or = (await createTranslator('en')).t(SIGN_IN.or);

for (const width of [375, 420]) {
  test.describe(`in a ${width} column`, () => {
    test('the word is a caption in the secondary ink, centred across the full column, no rules', async ({
      mount,
      page,
    }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const column = await mount(
        <div style={{ width }}>
          <TextDivider label={or} />
        </div>,
      );
      const word = column.getByText(or, { exact: true });
      await expect(word).toBeVisible();

      const look = await word.evaluate((element) => {
        const divider = element.parentElement as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(element);
        const ink = range.getBoundingClientRect();
        const box = divider.getBoundingClientRect();
        const style = getComputedStyle(element);
        const probe = document.createElement('div');
        probe.style.fontSize = 'var(--fs-caption)';
        document.body.append(probe);
        const caption = getComputedStyle(probe).fontSize;
        probe.remove();
        const rules = [divider, element].flatMap((node) =>
          ['::before', '::after'].map((pseudo) => getComputedStyle(node, pseudo).content),
        );
        return {
          fontSize: style.fontSize,
          caption,
          colour: style.color,
          inkCentre: ink.left + ink.width / 2,
          boxCentre: box.left + box.width / 2,
          boxWidth: box.width,
          borders: [divider, element].map((node) => getComputedStyle(node).borderTopStyle),
          rules,
        };
      });
      expect(look.fontSize).toBe(look.caption);
      expect(look.colour).toBe(await resolvedColour(page, '--text-secondary'));
      expect(Math.abs(look.inkCentre - look.boxCentre)).toBeLessThanOrEqual(1);
      expect(look.boxWidth).toBe(width);
      expect(look.borders).toEqual(['none', 'none']);
      expect(look.rules.every((content) => content === 'none' || content === 'normal')).toBe(true);
      expect(errors).toEqual([]);
    });
  });
}
