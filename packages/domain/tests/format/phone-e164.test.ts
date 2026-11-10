import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { phoneE164Of } from '../../src/format/phone';

describe('phoneE164Of — one number, however it is written, is one E.164 string (M02-02)', () => {
  it.each([
    '9845027746',
    '98450 27746',
    '98450-27746',
    '098450 27746',
    '09845027746',
    '919845027746',
    '91 98450 27746',
    '+919845027746',
    '+91 98450 27746',
    '+91-98450-27746',
    '(+91) 98450 27746',
    '+91 (0) 98450 27746',
    '0091 98450 27746',
    '00919845027746',
    ' 98450.27746 ',
    '९८४५० २७७४६',
    '+९१ ९८४५०२७७४६',
  ])('%j reads +919845027746', (typed) => {
    expect(phoneE164Of(IN_FORMATS, typed)).toBe('+919845027746');
  });

  it.each([
    ['+1 415 555 0134', '+14155550134'],
    ['0044 20 7946 0958', '+442079460958'],
  ])('another market’s number written with its code, %j, is kept whole', (typed, e164) => {
    expect(phoneE164Of(IN_FORMATS, typed)).toBe(e164);
  });

  it.each([
    '',
    'Priya',
    '98450 2774',
    '+91 98450 2774',
    '+91 98450 277461',
    '98450 277461',
    '19845027746',
    '9845027746 / 9822012345',
    '+12345',
    '+0 98450 27746',
  ])('%j is no number this market can store', (typed) => {
    expect(phoneE164Of(IN_FORMATS, typed)).toBeNull();
  });
});
