import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { ScaledProposalPage } from '../ProposalPages/ProposalPages';
import { ProposalPicture } from '../ProposalPicture/ProposalPicture';
import { StepHint } from '../ProposalSteps/StepParts';
import { Switch } from '../Switch/Switch';
import { BrandSwatch } from './BrandSwatch';
import {
  DEFAULTS_PAGE_WIDTH,
  sampleWith,
  type WallPage,
  wallLine,
  wallPages,
} from './ProposalTemplateSettings.logic';
import type {
  DefaultsLookView,
  DefaultsPagesView,
  DefaultsSample,
  ProposalDefaultsWords,
} from './ProposalTemplateSettings.types';

/** The wall's row length rides into the stylesheet as a custom property. */
type WallVars = CSSProperties & Record<`--${string}`, number>;

/** A picture tile's tick: drawn on the chosen one alone. */
function Chosen({ on }: { on: boolean }) {
  return (
    <span className="hg-pdf-check" data-on={on ? '' : undefined}>
      {on ? <ShellGlyph name="tick-small" size="sm" tone="inverse" /> : null}
    </span>
  );
}

/**
 * *Look* (`T-M01-030`): the cover picture every new proposal starts with — one of the platform's
 * four, or the company's own photo — and the brand, which is Branding's and only linked here.
 */
export function DefaultsLook({
  view,
  words,
}: {
  view: DefaultsLookView;
  words: ProposalDefaultsWords;
}) {
  const { own, brand } = view;
  const ownOn = view.chosen === 'own';
  return (
    <div className="hg-pst-controls">
      <div className="hg-pst-field">
        <span className="hg-pst-field-top">
          <span className="hg-pst-field-label">{words.coverPicture}</span>
          <span className="hg-pst-field-tag">{words.coverPictureTag}</span>
        </span>
        <div className="hg-pdf-covers" role="radiogroup" aria-label={words.coverPicture}>
          {view.covers.map((cover) => {
            const on = view.chosen === cover.key;
            return (
              <Pressable
                key={cover.key}
                className="hg-pdf-cover"
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => view.onCover(cover.key)}
              >
                <span className="hg-pdf-cover-in hg-pdf-tile" data-on={on ? '' : undefined}>
                  <span className="hg-pdf-cover-picture">
                    <ProposalPicture name={cover.key} />
                  </span>
                  <span className="hg-pdf-cover-words">
                    <span className="hg-pdf-cover-name">{cover.name}</span>
                    <span className="hg-pdf-cover-line">{cover.line}</span>
                  </span>
                  <Chosen on={on} />
                </span>
              </Pressable>
            );
          })}
          <Pressable
            className="hg-pdf-cover hg-pdf-cover-own"
            accessibilityRole="radio"
            accessibilityState={{ checked: ownOn, busy: own.storing }}
            disabled={own.storing}
            onPress={ownOn || own.onUse === undefined ? own.onChoose : own.onUse}
          >
            <span className="hg-pdf-own-in hg-pdf-tile" data-on={ownOn ? '' : undefined}>
              <span className="hg-pdf-own-picture">
                {own.src === undefined ? (
                  <ShellGlyph name="upload" size="md" />
                ) : (
                  <ProposalPicture src={own.src} />
                )}
              </span>
              <span className="hg-pdf-cover-words">
                <span className="hg-pdf-cover-name">{words.ownPhoto}</span>
                <span className="hg-pdf-cover-line">{words.ownPhotoLine}</span>
              </span>
              {own.src === undefined ? null : <Chosen on={ownOn} />}
            </span>
          </Pressable>
        </div>
        {own.error === undefined ? null : (
          <span className="hg-pdf-refusal" role="alert">
            <ShellGlyph name="alert-circle" size="sm" tone="danger" />
            {own.error}
          </span>
        )}
      </div>
      <Pressable className="hg-pdf-brand" accessibilityLabel={brand.label} onPress={brand.onOpen}>
        <span className="hg-pdf-brand-in hg-pdf-tile">
          <BrandSwatch brand={brand} />
          <span className="hg-pdf-cover-words">
            <span className="hg-pdf-cover-line">{brand.label}</span>
            <span className="hg-pdf-cover-name">{brand.value}</span>
          </span>
          <ShellGlyph name="chevron-right" size="sm" />
        </span>
      </Pressable>
      <StepHint>{words.lookHint}</StepHint>
    </div>
  );
}

/**
 * *Pages* (`T-M01-030`): one row per page with its thumbnail and a switch. The cover, the price
 * page and the terms carry a lock and *Always*, never a switch.
 */
export function DefaultsPages({
  view,
  sample,
  words,
}: {
  view: DefaultsPagesView;
  sample: DefaultsSample | null;
  words: ProposalDefaultsWords;
}) {
  return (
    <div className="hg-pst-controls">
      <div className="hg-pdf-pagerows hg-pdf-tile">
        {view.rows.map((row) => {
          const name = words.pageName[row.page];
          return (
            <div className="hg-pdf-pagerow" key={row.page} data-off={row.on ? undefined : ''}>
              <span className="hg-pdf-pagerow-thumb" aria-hidden="true">
                {sample === null ? null : (
                  <ScaledProposalPage
                    {...sampleWith(sample, row.page)}
                    page={row.page}
                    width={DEFAULTS_PAGE_WIDTH.row}
                    still
                  />
                )}
              </span>
              <span className="hg-pdf-pagerow-words">
                <span className="hg-pdf-cover-name">{name}</span>
                <span className="hg-pdf-cover-line">{words.pageWhat[row.page]}</span>
              </span>
              {row.always ? (
                <span className="hg-pst-lock">
                  <ShellGlyph name="lock" size="sm" />
                  {words.always}
                </span>
              ) : (
                <Switch
                  checked={row.on}
                  onChange={() => view.onToggle(row.page)}
                  ariaLabel={words.printPage(name)}
                />
              )}
            </div>
          );
        })}
      </div>
      <StepHint>{words.pagesHint}</StepHint>
    </div>
  );
}

function WallCell({
  wall,
  sample,
  words,
  width,
}: {
  wall: WallPage;
  sample: DefaultsSample;
  words: ProposalDefaultsWords;
  width: number;
}) {
  return (
    <div className="hg-pdf-wall-page" data-off={wall.on ? undefined : ''}>
      <ScaledProposalPage {...sampleWith(sample, wall.page)} page={wall.page} width={width} still />
      <span className="hg-pdf-wall-line">{wallLine(words, wall)}</span>
    </div>
  );
}

/** Every page at once: a page that is off stays on the wall, quiet, and says *Off*. */
export function DefaultsWall({
  sample,
  words,
  width,
  columns,
}: {
  sample: DefaultsSample;
  words: ProposalDefaultsWords;
  width: number;
  /** Pages a row holds; the last row starts at the left, as a document's pages are read. */
  columns: number;
}) {
  const room: WallVars = { '--hg-pdf-wall-columns': columns };
  return (
    <div className="hg-pdf-wall" style={room}>
      {wallPages(sample).map((wall) => (
        <WallCell key={wall.page} wall={wall} sample={sample} words={words} width={width} />
      ))}
    </div>
  );
}
