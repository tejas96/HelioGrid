import { useMemo } from 'react';
import { useCatalogFormats } from '../CatalogItems/use-catalog-formats';
import { useFormat } from '../MarketProvider/market-context';
import type { ImportFormats } from './CatalogImport.logic';

/** The market's money, date and clock, as the wizard's words take them. */
export function useImportFormats(): ImportFormats {
  const catalog = useCatalogFormats();
  const format = useFormat();
  return useMemo(
    () => ({ money: catalog.money, date: catalog.date, clockAt: format.clockAt }),
    [catalog, format],
  );
}
