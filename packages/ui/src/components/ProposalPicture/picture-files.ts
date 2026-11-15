/// <reference path="./picture-modules.d.ts" />
import type { ProposalPictureName } from './ProposalPicture.types';
import dusk from './pictures/dusk.jpg';
import evening from './pictures/evening.jpg';
import factory from './pictures/factory.jpg';
import home from './pictures/home.jpg';
import panels from './pictures/panels.jpg';
import roof from './pictures/roof.jpg';
import site from './pictures/site.jpg';
import society from './pictures/society.jpg';
import villa from './pictures/villa.jpg';

/** A picture's address on the web: Vite hands one over as it is, Next inside an object. */
function addressOf(file: string | number | { readonly src: string }): string | undefined {
  if (typeof file === 'string') return file;
  return typeof file === 'number' ? undefined : file.src;
}

const FILES: Readonly<Record<ProposalPictureName, string | undefined>> = {
  home: addressOf(home),
  villa: addressOf(villa),
  factory: addressOf(factory),
  society: addressOf(society),
  site: addressOf(site),
  roof: addressOf(roof),
  dusk: addressOf(dusk),
  panels: addressOf(panels),
  evening: addressOf(evening),
};

/** The address the web draws a platform picture from. */
export function pictureAddress(name: ProposalPictureName): string | undefined {
  return FILES[name];
}
