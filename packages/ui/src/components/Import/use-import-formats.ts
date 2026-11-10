import { useMemo } from 'react';
import { useCatalogFormats } from '../CatalogItems/use-catalog-formats';
import { useFormat } from '../MarketProvider/market-context';
import type { ImportFormats } from './Import.types';

/** The market's money, date and clock, as every import wizard's words take them. */
export function useImportFormats(): ImportFormats {
  const catalog = useCatalogFormats();
  const format = useFormat();
  return useMemo(
    () => ({ money: catalog.money, date: catalog.date, clockAt: format.clockAt }),
    [catalog, format],
  );
}
