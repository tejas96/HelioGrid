import type { ImportWizardFrame } from '@heliogrid/domain';
import type { catalogImportWords } from '@heliogrid/i18n';
import type { ImportBoardFrame } from '../components/CatalogImport.story';

type ImportWords = ReturnType<typeof catalogImportWords>;

/**
 * What each frame draws: its wizard frame, the act its foot offers (or none), and its way back —
 * the 375 head's *Back*, or the button that leads the 1536 foot — or none.
 */
export type Drawn = {
  frame: ImportWizardFrame;
  act: string | null;
  wide: boolean;
  lead: string | null;
};
export function framesDrawn(en: ImportWords): Readonly<Record<ImportBoardFrame, Drawn>> {
  return {
    'm17-k': { frame: 'empty', act: en.continue, wide: false, lead: null },
    'm17-l': { frame: 'unreadable', act: en.continue, wide: false, lead: null },
    'm17-a': { frame: 'file', act: en.continue, wide: false, lead: null },
    'm17-b': { frame: 'columns', act: en.continue, wide: false, lead: en.back },
    'm17-i': { frame: 'matching', act: en.continue, wide: false, lead: en.back },
    'm17-c': { frame: 'preview', act: en.importRows(405), wide: false, lead: en.back },
    'm17-d': { frame: 'preview', act: en.importRows(405), wide: false, lead: en.back },
    'm17-r': { frame: 'preview', act: en.importRows(405), wide: false, lead: en.back },
    'm17-m': { frame: 'preview', act: en.importRows(406), wide: false, lead: en.back },
    'm17-e': { frame: 'preview', act: en.importRows(405), wide: false, lead: en.back },
    'm17-n': { frame: 'running', act: en.stopWatching, wide: false, lead: null },
    'm17-j': { frame: 'report', act: null, wide: false, lead: null },
    'm17-o': { frame: 'report', act: en.fixRows(9), wide: false, lead: null },
    'm17-f': { frame: 'file', act: en.continue, wide: true, lead: en.back },
    'm17-g': { frame: 'columns', act: en.continue, wide: true, lead: en.back },
    'm17-h': { frame: 'preview', act: en.importRows(405), wide: true, lead: en.back },
    'm17-p': { frame: 'preview', act: en.importRows(406), wide: true, lead: en.back },
    'm17-q': { frame: 'report', act: en.fixRows(9), wide: true, lead: en.close },
  };
}
