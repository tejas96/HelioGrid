import { BrandBloom, Icon, Text } from '@heliogrid/ui';

/**
 * The 1.2 s beat after the code is accepted (`DONE_DWELL_MS`): a centred beat that owns the whole
 * page at both widths, drawn because on a slow hand-off it is the only thing saying it worked.
 */
export function SuccessDwell({ title, line }: { title: string; line: string }) {
  return (
    <main className="hg-door-dwell">
      <BrandBloom placement="centre" />
      <span className="hg-door-dwell-mark">
        <Icon size="lg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </Icon>
      </span>
      <div className="hg-door-dwell-words">
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary" align="center">
          {line}
        </Text>
      </div>
    </main>
  );
}
