/// <reference path="./picture-modules.d.ts" />
import type { ImageSourcePropType } from 'react-native';
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

/** Metro hands a bundled picture over as the number of its registered asset. */
function sourceOf(file: string | number | { readonly src: string }): ImageSourcePropType {
  if (typeof file === 'number') return file;
  return { uri: typeof file === 'string' ? file : file.src };
}

const FILES: Readonly<Record<ProposalPictureName, ImageSourcePropType>> = {
  home: sourceOf(home),
  villa: sourceOf(villa),
  factory: sourceOf(factory),
  society: sourceOf(society),
  site: sourceOf(site),
  roof: sourceOf(roof),
  dusk: sourceOf(dusk),
  panels: sourceOf(panels),
  evening: sourceOf(evening),
};

/** What the phone's image view draws a platform picture from. */
export function pictureSource(name: ProposalPictureName): ImageSourcePropType {
  return FILES[name];
}
