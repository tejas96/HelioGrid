import { describe, expect, it } from 'vitest';
import {
  pinText,
  readCoordinatePair,
  readCoordinates,
  roundPin,
} from '../../src/studio/coordinates';

describe('coordinates as a person gives them', () => {
  it('reads two filled fields as a point', () => {
    expect(readCoordinates('16.8367', ' 74.5966 ')).toEqual({
      kind: 'point',
      point: { latitude: 16.8367, longitude: 74.5966 },
    });
  });

  it('says nothing while both fields are empty, and names half an answer', () => {
    expect(readCoordinates('', '  ')).toEqual({ kind: 'empty' });
    expect(readCoordinates('16.8', '')).toEqual({ kind: 'fault', fault: 'incomplete' });
    expect(readCoordinates('', '74.5')).toEqual({ kind: 'fault', fault: 'incomplete' });
  });

  it('refuses words and a point off the globe, each with its own reason', () => {
    expect(readCoordinates('north', '74.5')).toEqual({ kind: 'fault', fault: 'not_numbers' });
    expect(readCoordinates('16.8.1', '74.5')).toEqual({ kind: 'fault', fault: 'not_numbers' });
    expect(readCoordinates('91', '74.5')).toEqual({ kind: 'fault', fault: 'out_of_range' });
    expect(readCoordinates('16.8', '-180.01')).toEqual({ kind: 'fault', fault: 'out_of_range' });
  });

  it('takes the edges of the globe', () => {
    expect(readCoordinates('-90', '180').kind).toBe('point');
  });

  it('reads a pasted pair with a comma or a space, and nothing else', () => {
    expect(readCoordinatePair('16.8367, 74.5966')).toEqual({
      latitude: 16.8367,
      longitude: 74.5966,
    });
    expect(readCoordinatePair(' 16.8367 74.5966 ')).toEqual({
      latitude: 16.8367,
      longitude: 74.5966,
    });
    expect(readCoordinatePair('12 MG Road, Pune 411001')).toBeNull();
    expect(readCoordinatePair('16.8367')).toBeNull();
    expect(readCoordinatePair('95, 74')).toBeNull();
  });

  it('stores six decimals and shows five', () => {
    expect(roundPin({ latitude: 16.83670049, longitude: 74.59660051 })).toEqual({
      latitude: 16.8367,
      longitude: 74.596601,
    });
    expect(pinText({ latitude: 16.8367, longitude: 74.5966 })).toBe('16.83670, 74.59660');
  });
});
