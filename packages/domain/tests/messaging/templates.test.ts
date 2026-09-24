import { describe, expect, it } from 'vitest';
import { composeMessage } from '../../src/messaging/templates';

/**
 * `F6-26` — a template's placeholders are resolved from the flow's facts, and one with no value
 * is left out cleanly: the customer never reads a raw `<date>` (`M01-55`: "every variable
 * resolved or safely omitted").
 */
const SURVEY_DONE = 'Survey done. Your proposal will reach you by <date>.';

describe('composeMessage — placeholders resolved or safely omitted (F6-26)', () => {
  it.each([
    [
      'every value given',
      SURVEY_DONE,
      { date: '28 Sep' },
      'Survey done. Your proposal will reach you by 28 Sep.',
      [],
    ],
    [
      'the value missing before a full stop',
      SURVEY_DONE,
      {},
      'Survey done. Your proposal will reach you by.',
      ['date'],
    ],
    [
      'the value an empty string',
      SURVEY_DONE,
      { date: '' },
      'Survey done. Your proposal will reach you by.',
      ['date'],
    ],
    [
      'the value only spaces',
      SURVEY_DONE,
      { date: '  ' },
      'Survey done. Your proposal will reach you by.',
      ['date'],
    ],
    [
      'one missing mid-sentence',
      'Hi <name>, <crew> arrives at 9.',
      { crew: 'Ravi' },
      'Hi, Ravi arrives at 9.',
      ['name'],
    ],
    ['the same placeholder twice', '<name> and <name>', { name: 'Asha' }, 'Asha and Asha', []],
    ['no placeholder at all', 'Thank you.', { name: 'Asha' }, 'Thank you.', []],
    ['a value that looks like a placeholder', 'By <date>.', { date: '<name>' }, 'By <name>.', []],
    [
      'text that is not a placeholder',
      'A <3 kWp> system for <name>.',
      { name: 'Asha' },
      'A <3 kWp> system for Asha.',
      [],
    ],
    ['every value missing', '<greeting> <name>', {}, '', ['greeting', 'name']],
    [
      'one missing at either end of a line',
      'Hi <name>\n<crew> comes at 9.',
      {},
      'Hi\ncomes at 9.',
      ['name', 'crew'],
    ],
    [
      'one missing between two words',
      'Your <kind> system is ready.',
      {},
      'Your system is ready.',
      ['kind'],
    ],
    ['two missing side by side', 'Hi <first><last> there', {}, 'Hi there', ['first', 'last']],
    ['a Hindi full stop after the gap', 'धन्यवाद <name>।', {}, 'धन्यवाद।', ['name']],
    ['a Windows line break after the gap', 'Hi <name>\r\nBye', {}, 'Hi\r\nBye', ['name']],
    ['a tab before the gap', 'Hi\t<name>.', {}, 'Hi.', ['name']],
    ['no space on either side of the gap', 'a<x>b', {}, 'ab', ['x']],
    ['a gap whose removal would join a new placeholder', '<<y>x>', { x: 'X' }, '<x>', ['y']],
    [
      'a private-use marker typed into the template',
      'Hi\uE001 <name>',
      { name: 'Asha' },
      'Hi Asha',
      [],
    ],
    ['a name an object inherits', 'Hi <toString>, welcome.', {}, 'Hi, welcome.', ['toString']],
    [
      "a value's own spacing, kept as given",
      'Address: <addr>.',
      { addr: 'Flat 4,\n   MG Road  ,Pune' },
      'Address: Flat 4,\n   MG Road  ,Pune.',
      [],
    ],
  ])('composes with %s', (_, template, values, text, omitted) => {
    expect(composeMessage(template, values)).toEqual({ text, omitted });
  });
});
