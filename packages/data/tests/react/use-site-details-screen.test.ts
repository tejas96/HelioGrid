// @vitest-environment happy-dom

import { IN_FORMATS } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSiteDetailsScreen } from '../../src/react/use-site-details-screen';
import {
  aDesign,
  answerNext,
  designId,
  holdWrites,
  mountedOver,
  origin,
  READS_ONLY_ROLE,
  SANGLI,
} from './studio-origin';

/**
 * Site details (`SCR-M05-01`) through the real client: the form opens from the design's read, a
 * typed address is searched once it rests, a picked place and a typed point set the pin, a map
 * service that is down leaves coordinates working, and the save starts the design.
 */

const MARKET = { formats: IN_FORMATS, language: 'en' } as const;
const SITE_PATH = `/designs/${designId(1)}/site`;

function mounted(id = designId(1)) {
  const moved: string[] = [];
  const view = mountedOver(() =>
    useSiteDetailsScreen(id, MARKET, { toDesign: (to) => moved.push(to) }),
  );
  return { view, moved };
}

async function opened() {
  origin.designs = origin.designs.length === 0 ? [aDesign(1)] : origin.designs;
  const world = mounted();
  await waitFor(() => expect(world.view.result.current.read.kind).toBe('ready'));
  return world;
}

type World = Awaited<ReturnType<typeof opened>>;
const shown = ({ view }: World) => {
  const { read } = view.result.current;
  if (read.kind !== 'ready') throw new Error(`the screen reads ${read.kind}`);
  return read.value;
};
const sitesSent = () => origin.writes.filter((write) => write.path === SITE_PATH);

describe('Site details — the read', () => {
  it('opens the form from the design: the customer’s name, a roof, one phase', async () => {
    const world = await opened();
    expect(shown(world).form).toMatchObject({
      name: 'Anil Sharma',
      mount: 'roof',
      pin: null,
      supplyPhase: 'single',
    });
    expect(shown(world).areas.find((area) => area.code === 'IN-MH')?.name).toBe('Maharashtra');
    expect(world.view.result.current.changed).toBe(false);
  });

  it('opens with the site the lead already holds', async () => {
    origin.site = {
      name: 'Sharma residence',
      address: SANGLI.address,
      pin: SANGLI.pin,
      area: { area: 'IN-MH', district: 'Sangli' },
      utilityOperator: 'MSEDCL',
      supplyPhase: 'three',
      sanctionedLoadKw: 8,
    };
    const world = await opened();
    expect(shown(world)).toMatchObject({
      pin: '16.83670, 74.59660',
      pinMoved: false,
      form: { name: 'Sharma residence', supplyPhase: 'three', sanctionedLoad: '8' },
    });
    expect(shown(world).operators).toContain('MSEDCL');
  });

  it.each([
    [null, false],
    [SANGLI.pin, true],
  ] as const)('a site whose pin is %o reads as started: %s', async (pin, started) => {
    origin.site = { ...origin.site, pin };
    expect(shown(await opened()).started).toBe(started);
  });

  it('a design that is not the reader’s to see reads unavailable', async () => {
    const world = mounted(designId(9));
    await waitFor(() => expect(world.view.result.current.read.kind).toBe('unavailable'));
  });

  it('tells a reader without the grant that they may not change it', async () => {
    origin.roles = [READS_ONLY_ROLE];
    expect(shown(await opened()).detail.canEdit).toBe(false);
  });
});

describe('Site details — finding the place', () => {
  it('searches a typed address once it rests, and a picked place sets the pin and the state', async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.address('vishrambag'));
    expect(shown(world).search.kind).toBe('searching');
    await waitFor(() => expect(shown(world).search.kind).toBe('found'));
    const { search } = shown(world);
    expect(search.kind === 'found' ? search.places.map((one) => one.placeId) : []).toEqual([
      'place-sangli',
    ]);
    act(() => world.view.result.current.acts.pickPlace('place-sangli'));
    await waitFor(() => expect(shown(world).pin).toBe('16.83670, 74.59660'));
    expect(shown(world).form).toMatchObject({
      address: SANGLI.address,
      area: { area: 'IN-MH', district: null },
      areaFromPlace: true,
    });
    expect(shown(world).search.kind).toBe('idle');
    expect(world.view.result.current.changed).toBe(true);
  });

  it('says no place where the service knows none, and asks nothing under three letters', async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.address('vi'));
    expect(shown(world).search.kind).toBe('idle');
    act(() => world.view.result.current.acts.address('nowhere at all'));
    await waitFor(() => expect(shown(world).search).toEqual({ kind: 'found', places: [] }));
  });

  it('a map service that is down reads unavailable, and typed coordinates still set the pin', async () => {
    origin.placesUp = false;
    const world = await opened();
    act(() => world.view.result.current.acts.address('vishrambag'));
    await waitFor(() => expect(shown(world).search.kind).toBe('unavailable'));
    act(() => {
      world.view.result.current.acts.mode('coordinates');
      world.view.result.current.acts.latitude('16.8367');
      world.view.result.current.acts.longitude('74.5966');
      world.view.result.current.acts.readCoordinates();
    });
    expect(shown(world).pin).toBe('16.83670, 74.59660');
    expect(shown(world).form.fault).toBeNull();
  });

  it('a pasted pair is used at once and the search fills the address and the state', async () => {
    const world = await opened();
    let used = false;
    act(() => {
      used = world.view.result.current.acts.paste('16.8367, 74.5966');
    });
    expect(used).toBe(true);
    expect(shown(world).form.mode).toBe('coordinates');
    await waitFor(() => expect(shown(world).form.address).toBe(SANGLI.address));
    expect(shown(world).form.area).toEqual({ area: 'IN-MH', district: null });
    let ignored = true;
    act(() => {
      ignored = world.view.result.current.acts.paste('12 MG Road, Pune');
    });
    expect(ignored).toBe(false);
  });

  it('refuses a point outside the market, with its reason and no pin', async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.paste('48.1374, 11.5755'));
    await waitFor(() => expect(shown(world).form.fault).toBe('outside_market'));
    expect(shown(world).pin).toBeNull();
  });

  it('a moved pin stands apart from its place, and is put back', async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.paste('16.8367, 74.5966'));
    act(() => world.view.result.current.acts.movePin({ latitude: 16.8371, longitude: 74.5969 }));
    expect(shown(world)).toMatchObject({ pin: '16.83710, 74.59690', pinMoved: true });
    act(() => world.view.result.current.acts.putBack());
    expect(shown(world)).toMatchObject({ pin: '16.83670, 74.59660', pinMoved: false });
  });
});

describe('Site details — Start design', () => {
  const located = async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.paste('16.8367, 74.5966'));
    await waitFor(() => expect(shown(world).form.address).toBe(SANGLI.address));
    return world;
  };

  it('sends nothing while no location is set', async () => {
    const world = await opened();
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.saving).toBe(false));
    expect(sitesSent()).toHaveLength(0);
  });

  it('saves the site whole and opens the design', async () => {
    const world = await located();
    act(() => {
      world.view.result.current.acts.mount('ground');
      world.view.result.current.acts.load('8');
    });
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.moved).toEqual([designId(1)]));
    expect(sitesSent()[0]?.body).toMatchObject({
      name: 'Anil Sharma',
      address: SANGLI.address,
      pin: { latitude: 16.8367, longitude: 74.5966 },
      area: { area: 'IN-MH', district: null },
      supplyPhase: 'single',
      sanctionedLoadKw: 8,
      mount: 'ground',
    });
    expect(world.view.result.current.changed).toBe(false);
    expect(world.view.result.current.failure).toBeNull();
    // The first pin it saved does not turn the form into a change of a started design.
    expect(shown(world).started).toBe(false);
  });

  it('reads numbers still in the fields before it saves, so the typed point is the one sent', async () => {
    const world = await located();
    // On touch the press lands while the pair still holds the caret: nothing read the fields yet.
    act(() => {
      world.view.result.current.acts.mode('coordinates');
      world.view.result.current.acts.latitude('18.5204');
      world.view.result.current.acts.longitude('73.8567');
    });
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.moved).toEqual([designId(1)]));
    expect(sitesSent()[0]?.body).toMatchObject({ pin: { latitude: 18.5204, longitude: 73.8567 } });
  });

  it('a map that settles while the save is out moves nothing: the pin sent is the pin kept', async () => {
    const world = await located();
    act(() => {
      world.view.result.current.start();
      world.view.result.current.acts.movePin({ latitude: 16.84, longitude: 74.6 });
    });
    await waitFor(() => expect(world.moved).toEqual([designId(1)]));
    expect(shown(world).form.pin).toEqual({ latitude: 16.8367, longitude: 74.5966 });
    expect(world.view.result.current.changed).toBe(false);
  });

  it('a second press while the save is out sends nothing', async () => {
    const world = await located();
    const release = holdWrites();
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.saving).toBe(true));
    act(() => world.view.result.current.start());
    release();
    await waitFor(() => expect(world.moved).toEqual([designId(1)]));
    expect(sitesSent()).toHaveLength(1);
  });

  it('a save that came back undone says so, keeps what was typed and opens nothing', async () => {
    const world = await located();
    answerNext('site', 'drop');
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.failure).toBe('other'));
    expect(world.moved).toEqual([]);
    expect(shown(world).form.address).toBe(SANGLI.address);
    expect(world.view.result.current.changed).toBe(true);
  });

  it('a lead closed meanwhile refuses with its own reason', async () => {
    const world = await located();
    answerNext('site', {
      status: 422,
      body: {
        error: {
          code: 'DESIGN_ACT_REFUSED',
          message: 'refused',
          requestId: 'test',
          facts: { refusal: 'host_closed' },
        },
      },
    });
    act(() => world.view.result.current.start());
    await waitFor(() => expect(world.view.result.current.failure).toBe('host_closed'));
  });
});

describe('Site details — leaving', () => {
  it('holds a move until the person chooses; leaving drops what was typed', async () => {
    const world = await opened();
    act(() => world.view.result.current.acts.name('Changed name'));
    expect(world.view.result.current.changed).toBe(true);
    const left: string[] = [];
    act(() => world.view.result.current.leave.ask(() => left.push('gone')));
    expect(world.view.result.current.leave.asking).toBe(true);
    act(() => world.view.result.current.leave.stay());
    expect(world.view.result.current.leave.asking).toBe(false);
    expect(left).toEqual([]);
    expect(shown(world).form.name).toBe('Changed name');
    act(() => world.view.result.current.leave.ask(() => left.push('gone')));
    act(() => world.view.result.current.leave.leave());
    expect(left).toEqual(['gone']);
    expect(world.view.result.current.changed).toBe(false);
    expect(shown(world).form.name).toBe('Anil Sharma');
  });
});
