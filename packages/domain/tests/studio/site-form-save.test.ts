import { describe, expect, it } from 'vitest';
import { siteSaveOf } from '../../src/studio/site-form';
import { empty, SANGLI, stepped } from './site-form-support';

describe('the connection', () => {
  it('a picked state drops an operator it does not list and picks its only one', () => {
    const maharashtra = stepped(
      empty(),
      { kind: 'area-picked', area: 'IN-MH' },
      { kind: 'operator-picked', operator: 'MSEDCL' },
    );
    expect(maharashtra.utilityOperator).toBe('MSEDCL');
    expect(stepped(maharashtra, { kind: 'area-picked', area: 'IN-TN' }).utilityOperator).toBe(
      'TANGEDCO',
    );
    expect(stepped(maharashtra, { kind: 'area-picked', area: null })).toMatchObject({
      area: null,
      utilityOperator: null,
    });
  });

  it('keeps a typed load to digits and a point', () => {
    expect(stepped(empty(), { kind: 'load-typed', load: '8.5 kW' }).sanctionedLoad).toBe('8.5');
    // A second point is a slip of the finger: kept, it would read as no load and clear the site's.
    expect(stepped(empty(), { kind: 'load-typed', load: '5.5.5' }).sanctionedLoad).toBe('5.55');
    expect(stepped(empty(), { kind: 'load-typed', load: '..5' }).sanctionedLoad).toBe('.5');
  });
});

describe('what the form saves', () => {
  it('nothing without a pin', () => {
    expect(siteSaveOf(empty())).toBeNull();
  });

  it('the pin and every fact typed, with a gap for each one left empty', () => {
    const form = stepped(
      empty(),
      { kind: 'name-typed', name: '  ' },
      { kind: 'coordinates-pasted', point: SANGLI },
      { kind: 'mount-picked', mount: 'ground' },
      { kind: 'phase-picked', phase: 'three' },
    );
    expect(siteSaveOf(form)).toEqual({
      name: null,
      address: null,
      pin: SANGLI,
      area: null,
      utilityOperator: null,
      supplyPhase: 'three',
      sanctionedLoadKw: null,
      mount: 'ground',
    });
  });

  it('a load of nothing, of zero or beyond what a site holds is no load', () => {
    const withLoad = (load: string) =>
      siteSaveOf(
        stepped(
          empty(),
          { kind: 'coordinates-pasted', point: SANGLI },
          { kind: 'load-typed', load },
        ),
      )?.sanctionedLoadKw;
    expect(withLoad('8.5')).toBe(8.5);
    expect(withLoad('0')).toBeNull();
    expect(withLoad('')).toBeNull();
    expect(withLoad('.')).toBeNull();
    expect(withLoad('999999')).toBeNull();
  });
});
