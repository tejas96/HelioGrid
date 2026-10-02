'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  AppHeader,
  IconButton,
  LogoTile,
  MIN_TOUCH_TARGET,
  SearchField,
  ShellGlyph,
  Text,
} from '@heliogrid/ui';
import { useState } from 'react';

interface ShellHeaderProps {
  /** The company's name, or none while it loads or after it failed — the bar then shows none. */
  companyName: string | null;
  /** Opens the search door. Absent on Frame 8, whose bar keeps the product mark and the name. */
  onSearch?: () => void;
}

/**
 * The web header (`SCR-SHELL-01`): the company's name as words (`F7-07`) and the one search
 * (`F6-20`). The rail draws the product mark, so the bar does not — except on Frame 8, which has no
 * rail. The search is a field from `--bp-desktop` up and a button below it, where the rail and the
 * name leave no room for a field; Enter or the button opens the search door.
 */
export function ShellHeader({ companyName, onSearch }: ShellHeaderProps) {
  const t = useTranslate();
  const [query, setQuery] = useState('');
  const tenant =
    companyName === null ? undefined : (
      <Text variant="body-sm" bold oneLine className="hg-shell-company">
        {companyName}
      </Text>
    );

  if (onSearch === undefined) {
    return (
      <AppHeader
        brand={<LogoTile size={theme.spacing['sp-8']} radius={theme.radius['r-sm']} />}
        tenant={tenant}
      />
    );
  }
  return (
    <AppHeader
      tenant={tenant}
      search={
        <>
          <form
            className="hg-shell-search-field"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch();
            }}
          >
            <SearchField
              density="functional"
              placeholder={t(SHELL.searchPlaceholder)}
              ariaLabel={t(SHELL.search)}
              value={query}
              onChange={setQuery}
            />
          </form>
          <span className="hg-shell-search-button">
            <IconButton
              label={t(SHELL.search)}
              variant="ghost"
              size={MIN_TOUCH_TARGET}
              onClick={onSearch}
            >
              <ShellGlyph name="search" size="md" />
            </IconButton>
          </span>
        </>
      }
    />
  );
}
