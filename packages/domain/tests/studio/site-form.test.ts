import { describe, expect, it } from 'vitest';
import { siteFormOf, sitePinMoved } from '../../src/studio/site-form';
import { empty, found, NO_SITE, SANGLI, stepped } from './site-form-support';

describe('the form a design opens with', () => {
  it('takes the customer’s name when the site has none, on a roof, on one phase', () => {
    expect(empty()).toMatchObject({
      name: 'Anil Sharma',
      mount: 'roof',
      mode: 'address',
      pin: null,
      supplyPhase: 'single',
      sanctionedLoad: '',
    });
  });

  it('opens with what the site holds', () => {
    const form = siteFormOf(
      {
        name: 'Sharma residence',
        address: 'Vishrambag, Sangli',
        pin: SANGLI,
        area: { area: 'IN-MH', district: 'Sangli' },
        utilityOperator: 'MSEDCL',
        supplyPhase: 'three',
        sanctionedLoadKw: 8,
      },
      'ground',
      'Anil Sharma',
    );
    expect(form).toMatchObject({
      name: 'Sharma residence',
      mount: 'ground',
      latitude: '16.83670',
      longitude: '74.59660',
      area: { area: 'IN-MH', district: 'Sangli' },
      supplyPhase: 'three',
      sanctionedLoad: '8',
    });
    expect(sitePinMoved(form)).toBe(false);
  });

  it('opens on coordinates for a site that holds a point and no address', () => {
    expect(siteFormOf({ ...NO_SITE, pin: SANGLI }, 'roof', null).mode).toBe('coordinates');
  });
});

describe('a found place', () => {
  it('sets the pin, fills the state and says the state came from the place', () => {
    const form = stepped(empty(), { kind: 'place-found', place: found() });
    expect(form).toMatchObject({
      address: 'Vishrambag, Sangli',
      pin: SANGLI,
      placed: SANGLI,
      area: { area: 'IN-MH', district: null },
      areaFromPlace: true,
      utilityOperator: null,
      fault: null,
    });
  });

  it('picks the operator of a state that lists one', () => {
    const form = stepped(empty(), { kind: 'place-found', place: found({ area: 'IN-TN' }) });
    expect(form.utilityOperator).toBe('TANGEDCO');
  });

  it('keeps the district and the operator when the state is the one already set', () => {
    const held = siteFormOf(
      { ...NO_SITE, area: { area: 'IN-MH', district: 'Sangli' }, utilityOperator: 'BEST' },
      'roof',
      null,
    );
    const form = stepped(held, { kind: 'place-found', place: found() });
    expect(form.area).toEqual({ area: 'IN-MH', district: 'Sangli' });
    expect(form.utilityOperator).toBe('BEST');
    expect(form.areaFromPlace).toBe(false);
  });

  it('keeps the typed address when the place has none, and the state when the region matched none', () => {
    const form = stepped(
      empty(),
      { kind: 'area-picked', area: 'IN-GA' },
      { kind: 'place-found', place: found({ address: null, area: null }) },
    );
    expect(form.address).toBe('');
    expect(form.area).toEqual({ area: 'IN-GA', district: null });
    expect(form.pin).toEqual(SANGLI);
  });

  it('is refused outside the market, with its own reason and no pin', () => {
    const form = stepped(empty(), { kind: 'place-found', place: found({ inMarket: false }) });
    expect(form).toMatchObject({ pin: null, placed: null, fault: 'outside_market' });
  });

  it('no longer stands once the address is typed again', () => {
    const form = stepped(
      empty(),
      { kind: 'place-found', place: found() },
      { kind: 'address-typed', address: 'Pune' },
    );
    expect(form).toMatchObject({ address: 'Pune', pin: null, placed: null });
  });
});

describe('typed coordinates', () => {
  it('are read together into the pin', () => {
    const form = stepped(
      empty(),
      { kind: 'mode-picked', mode: 'coordinates' },
      { kind: 'coordinates-typed', latitude: '16.8367' },
      { kind: 'coordinates-typed', longitude: '74.5966' },
      { kind: 'coordinates-read' },
    );
    expect(form).toMatchObject({ pin: SANGLI, placed: SANGLI, fault: null });
    expect(form.latitude).toBe('16.83670');
  });

  it('half an answer and a point off the globe are named, and set no pin', () => {
    const half = stepped(
      empty(),
      { kind: 'coordinates-typed', latitude: '16.8' },
      { kind: 'coordinates-read' },
    );
    expect(half).toMatchObject({ pin: null, fault: 'incomplete' });
    const off = stepped(
      empty(),
      { kind: 'coordinates-typed', latitude: '95', longitude: '74' },
      { kind: 'coordinates-read' },
    );
    expect(off).toMatchObject({ pin: null, fault: 'out_of_range' });
  });

  it('typing again clears the fault, and two empty fields are no answer yet', () => {
    const form = stepped(
      empty(),
      { kind: 'coordinates-typed', latitude: '95', longitude: '74' },
      { kind: 'coordinates-read' },
      { kind: 'coordinates-typed', latitude: '' },
    );
    expect(form.fault).toBeNull();
    const none = empty();
    expect(stepped(none, { kind: 'coordinates-read' })).toBe(none);
  });

  it.each([
    ['in Latitude', { latitude: '16.8367, 74.5966' }],
    ['in Longitude', { longitude: '16.8367,74.5966' }],
  ])('a pair typed whole %s is split into both fields when it is read', (_, typed) => {
    const form = stepped(
      empty(),
      { kind: 'mode-picked', mode: 'coordinates' },
      { kind: 'coordinates-typed', ...typed },
      { kind: 'coordinates-read' },
    );
    expect(form).toMatchObject({ pin: SANGLI, placed: SANGLI, fault: null });
    expect([form.latitude, form.longitude]).toEqual(['16.83670', '74.59660']);
  });

  it('a pair being typed is not split per keystroke: only its read splits it', () => {
    const form = stepped(empty(), { kind: 'coordinates-typed', latitude: '16.8367, 74.5966' });
    expect(form).toMatchObject({ latitude: '16.8367, 74.5966', longitude: '', pin: null });
  });

  it('a pasted pair is used at once, in either mode', () => {
    const form = stepped(empty(), { kind: 'coordinates-pasted', point: SANGLI });
    expect(form).toMatchObject({
      mode: 'coordinates',
      pin: SANGLI,
      latitude: '16.83670',
      longitude: '74.59660',
    });
  });
});

describe('what a search says of a typed point', () => {
  const typed = () => stepped(empty(), { kind: 'coordinates-pasted', point: SANGLI });

  it('fills the address and the state while they are empty, and leaves the pin alone', () => {
    const near = { latitude: 16.84, longitude: 74.6 };
    const form = stepped(typed(), { kind: 'point-located', place: found({ pin: near }) });
    expect(form).toMatchObject({
      pin: SANGLI,
      address: 'Vishrambag, Sangli',
      area: { area: 'IN-MH', district: null },
      areaFromPlace: true,
    });
  });

  it('never replaces an address or a state the site already holds', () => {
    const held = stepped(
      siteFormOf(
        {
          ...NO_SITE,
          address: 'Flat 4, Shanti Apartments',
          area: { area: 'IN-GA', district: null },
        },
        'roof',
        null,
      ),
      { kind: 'coordinates-pasted', point: SANGLI },
      { kind: 'point-located', place: found() },
    );
    expect(held.address).toBe('Flat 4, Shanti Apartments');
    expect(held.area).toEqual({ area: 'IN-GA', district: null });
    expect(held.areaFromPlace).toBe(false);
  });

  it('refuses a point outside the market, with its reason and no pin', () => {
    const form = stepped(typed(), { kind: 'point-located', place: found({ inMarket: false }) });
    expect(form).toMatchObject({ pin: null, fault: 'outside_market' });
  });
});

describe('the pin on the map', () => {
  const moved = () =>
    stepped(
      empty(),
      { kind: 'place-found', place: found() },
      { kind: 'pin-moved', point: { latitude: 16.8371, longitude: 74.5969 } },
    );

  it('moves apart from its place, and the fields follow it', () => {
    const form = moved();
    expect(form.pin).toEqual({ latitude: 16.8371, longitude: 74.5969 });
    expect(form.placed).toEqual(SANGLI);
    expect(form.latitude).toBe('16.83710');
    expect(sitePinMoved(form)).toBe(true);
  });

  it('is put back where its place is', () => {
    const form = stepped(moved(), { kind: 'pin-reset' });
    expect(form.pin).toEqual(SANGLI);
    expect(sitePinMoved(form)).toBe(false);
  });

  it('stays where the map left it when the fields that follow it are read back', () => {
    // The map rests at six decimals and the fields show five: reading them is no new answer.
    const rested = { latitude: 16.837123, longitude: 74.596987 };
    const form = stepped(
      empty(),
      { kind: 'place-found', place: found() },
      { kind: 'pin-moved', point: rested },
    );
    const read = stepped(form, { kind: 'coordinates-read' });
    expect(read).toBe(form);
    expect(read.pin).toEqual(rested);
    expect(sitePinMoved(read)).toBe(true);
  });
});
