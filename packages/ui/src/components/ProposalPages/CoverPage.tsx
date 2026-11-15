import { useFormat } from '../MarketProvider/market-context';
import { ProposalPicture } from '../ProposalPicture';
import { ProvenanceTier } from '../Provenance';
import { TenantMark } from '../TenantHeader';
import { brandVars } from './PageSheet';
import { coverFiguresOf, sheetPlace } from './ProposalPages.logic';
import type { ProposalCoverProps } from './ProposalPages.types';

/** The middle dot between the number and the date: a mark, not a word. */
const DOT = ' · ';

/**
 * The cover (`M06-51`): the picture edge to edge, the company's mark and name, the number and the
 * date, who it is for, one line for the system, three figures on glass, each with its tier (`F8-01`:
 * a payback is a money figure) — and who prepared it with its
 * validity. The words sit on the picture's shade, so they hold WCAG AA over any picture. A draft
 * with no price yet has no figure to state: the glass is left out until one exists.
 */
export function CoverPage({
  snapshot,
  facts,
  words,
  still = false,
}: Omit<ProposalCoverProps, 'page'>) {
  const format = useFormat();
  const { company } = snapshot;
  const figures = coverFiguresOf({ snapshot, facts, words }, format);
  const place = sheetPlace({ page: 'cover', snapshot });
  const picture = snapshot.fields.company.coverPicture;
  const cover = words.cover;
  return (
    <article
      className="hg-pp hg-pp-cover"
      data-paper=""
      data-page="cover"
      data-still={still ? '' : undefined}
      aria-label={words.pageName(words.titles.cover, place.number, place.count)}
      style={brandVars(company.brandColour ?? undefined)}
    >
      <ProposalPicture
        name={picture.kind === 'platform' ? picture.key : undefined}
        src={picture.kind === 'own' ? facts.coverSrc : undefined}
        shade="cover"
        className="hg-pp-cover-picture"
      >
        <header className="hg-pp-cover-top">
          <span className="hg-pp-cover-brand">
            <TenantMark
              logo={facts.logoSrc}
              name={company.name}
              size={42}
              radius={12}
              showName={false}
            />
            <span className="hg-pp-cover-brand-words">
              <b>{company.name}</b>
            </span>
          </span>
          <span className="hg-pp-cover-number hg-pb-mono">
            {facts.number ?? cover.draft}
            {DOT}
            {facts.dateText}
          </span>
        </header>
        <div className="hg-pp-cover-words">
          <span className="hg-pp-cover-over">{cover.over}</span>
          {snapshot.deal.clientName === null ? null : <h1>{snapshot.deal.clientName}</h1>}
          {cover.system === undefined ? null : <p>{cover.system}</p>}
        </div>
        {figures.length === 0 ? null : (
          <div className="hg-pp-cover-glass">
            {figures.map((figure) => (
              <div key={figure.key}>
                <span className="hg-pp-cover-value">{figure.value}</span>
                <span className="hg-pp-cover-label">
                  {figure.label}
                  <ProvenanceTier tier={figure.tier} />
                </span>
              </div>
            ))}
          </div>
        )}
        <footer className="hg-pp-cover-foot">
          <span>{cover.preparedBy}</span>
          <span>{cover.validity}</span>
        </footer>
      </ProposalPicture>
    </article>
  );
}
