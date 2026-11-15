import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Card } from '../Card';
import { useFormat } from '../MarketProvider';
import { ProvenanceTier } from '../Provenance';
import { RollingNumber } from '../RollingNumber';
import { type ForecastRow, forecastRowsOf } from './OwnerDashboard.forecast';
import type { DashboardPartProps } from './OwnerDashboard.logic';
import { ForecastTile } from './WonCard';
import './ForecastCard.css';

type WeightVars = CSSProperties & Record<'--hg-owner-forecast-weight', string>;

function RowFace({ row }: { row: ForecastRow }) {
  return (
    <>
      <span className="hg-owner-forecast-dot" data-hue={row.hue} aria-hidden="true" />
      <span className="hg-owner-forecast-words">
        <b>{row.name}</b>
        <span>{row.line}</span>
      </span>
      <span className="hg-owner-forecast-amount">{row.expected}</span>
    </>
  );
}

/**
 * The forecast (`M13-03`, `T-M13-007`): what the open proposals are expected to bring, with its
 * tier, the count behind it, one bar split by stage and a row per stage. Expected, never promised,
 * and never in a total with won — the card says so in words. An api built before proposals sends
 * no forecast, and the card is then the honest gap it was.
 */
export function ForecastCard({ view, words, onForecastStage }: DashboardPartProps) {
  const format = useFormat();
  const { forecast } = view;
  if (forecast === undefined) return <ForecastTile words={words} />;
  const rows = forecastRowsOf(forecast, words, format);
  return (
    <Card className="hg-owner-card">
      <section className="hg-owner-card-body" aria-label={words.forecastTitle}>
        <div className="hg-owner-card-head">
          <Text as="h2" variant="overline" color="secondary">
            {words.forecastTitle}
          </Text>
          <ProvenanceTier tier={forecast.tier} />
        </div>
        <div className="hg-owner-figure-block">
          <span className="hg-owner-tile-figure">
            <RollingNumber value={format.moneyPlain(forecast.expected)} variant="figure" />
          </span>
          <Text variant="body-sm" color="secondary">
            {words.forecastFrom(forecast.count)}
          </Text>
        </div>
        {rows.length === 0 ? null : (
          <>
            <div className="hg-owner-forecast-bar" role="img" aria-label={words.forecastBarName}>
              {rows.map((row) => {
                const vars: WeightVars = { '--hg-owner-forecast-weight': String(row.weight) };
                return <i key={row.key} data-hue={row.hue} style={vars} />;
              })}
            </div>
            <ul className="hg-owner-forecast-rows">
              {rows.map((row) => (
                <li key={row.key}>
                  {onForecastStage === undefined ? (
                    <span className="hg-owner-forecast-row">
                      <RowFace row={row} />
                    </span>
                  ) : (
                    <Pressable
                      className="hg-owner-forecast-row"
                      onPress={() => onForecastStage(row.key)}
                    >
                      <RowFace row={row} />
                    </Pressable>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="hg-owner-forecast-note">
          <ShellGlyph name="info-circle" size="sm" tone="secondary" />
          <span>{words.forecastHonest}</span>
        </p>
      </section>
    </Card>
  );
}
