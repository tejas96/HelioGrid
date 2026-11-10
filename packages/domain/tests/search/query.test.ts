import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { searchQueryOf, searchTermsOf } from '../../src/search/query';

describe('searchQueryOf — a phone, whole or begun, in the stored form (F6-20)', () => {
  it.each([
    ['98450 27746', { e164Prefix: '+919845027746', e164: '+919845027746' }],
    ['+91 98450-27746', { e164Prefix: '+919845027746', e164: '+919845027746' }],
    ['098450 27746', { e164Prefix: '+919845027746', e164: '+919845027746' }],
    ['98450', { e164Prefix: '+9198450', e164: null }],
    ['0984', { e164Prefix: '+91984', e164: null }],
    ['+91 984', { e164Prefix: '+91984', e164: null }],
    ['+91 (0) 984', { e164Prefix: '+91984', e164: null }],
    ['0091 984', { e164Prefix: '+91984', e164: null }],
    ['+1 415', { e164Prefix: '+1415', e164: null }],
    ['९८४५०', { e164Prefix: '+9198450', e164: null }],
    ['550', { e164Prefix: '+91550', e164: null }],
  ])('%s asks for %j', (typed, phone) => {
    expect(searchQueryOf(IN_FORMATS, typed).phone).toEqual(phone);
  });

  it.each(['', '   ', '+', '+9', '+91', '0', '00', '-', 'Priya', 'NP-1', 'Nashik 2'])(
    '%j asks for no phone',
    (typed) => {
      expect(searchQueryOf(IN_FORMATS, typed).phone).toBeNull();
    },
  );
});

describe('searchTermsOf — whole tokens, the hyphen kept', () => {
  it.each([
    ['NP-1', ['np-1']],
    ['PE-575 Bi-55', ['pe-575', 'bi-55']],
    ['  Priya   Sharma ', ['priya', 'sharma']],
    ['Priya, Nashik', ['priya', 'nashik']],
    ['priya PRIYA', ['priya']],
    ['- -x- y-', ['x', 'y']],
    ['प्रिया शर्मा', ['प्रिया', 'शर्मा']],
    ['Waaree 550W', ['waaree', '550w']],
    ['', []],
  ])('%j reads %j', (text, terms) => {
    expect(searchTermsOf(text)).toEqual(terms);
  });

  it('a phone-shaped query carries its terms too, since a model may be digits alone', () => {
    expect(searchQueryOf(IN_FORMATS, '550').terms).toEqual(['550']);
  });
});
