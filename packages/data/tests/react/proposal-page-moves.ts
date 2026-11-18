/**
 * The moves the Proposals page and *New proposal* are handed, each written down as it is taken:
 * `builder:<id>`, `proposal:<id>`, `design:<id>`, `site:<id>`.
 */
export const recorded = (opened: string[]) => ({
  toBuilder: (id: string) => void opened.push(`builder:${id}`),
  toProposal: (id: string) => void opened.push(`proposal:${id}`),
  toDesign: (id: string) => void opened.push(`design:${id}`),
  toSiteDetails: (id: string) => void opened.push(`site:${id}`),
});
export const nowhere = () => recorded([]);
