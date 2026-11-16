import { Pressable } from '../../primitives/Pressable/Pressable';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { BrandBloom } from '../BrandBloom/BrandBloom';
import { Button } from '../Button/Button';
import { labelRunsOf } from '../Button/Button.logic';
import { Badge } from '../Chip/Chip';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import type { ProposalReadyProps } from './ProposalReady.types';
import './ProposalReady.css';

/** The moment a proposal exists: its cover, its number, and the way on. */
export function ProposalReady(props: ProposalReadyProps) {
  const { words, wide } = props;
  return (
    <div className="hg-prdy" data-form={wide ? 'desktop' : 'phone'}>
      <div className="hg-prdy-art">
        <BrandBloom placement="centre" />
        <div className="hg-prdy-paper">{props.cover}</div>
        <span className="hg-prdy-mark">
          <LottieMoment name="published" size={96} label={words.moment} />
        </span>
      </div>
      <div className="hg-prdy-words">
        <Badge tone="success" glyph="check">
          {words.status}
        </Badge>
        <h1 className="hg-prdy-title">{words.title}</h1>
        <p className="hg-prdy-line">
          {labelRunsOf(words.line, words.lineFigures).map((run) =>
            run.mono ? (
              <span key={run.text} className="hg-prdy-number">
                {run.text}
              </span>
            ) : (
              run.text
            ),
          )}
        </p>
        <div className="hg-prdy-acts">
          <Button
            variant="primary"
            size="lg"
            fullWidth={!wide}
            iconRight={<ShellGlyph name="arrow-right" size="sm" tone="inverse" />}
            onClick={props.onShare}
          >
            {words.share}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth={!wide}
            loading={props.downloading === true}
            icon={<ShellGlyph name="download" size="sm" />}
            onClick={props.onDownload}
          >
            {words.download}
          </Button>
        </div>
        <Pressable className="hg-prdy-back" onPress={props.onBack}>
          <span className="hg-prdy-back-in">{words.back}</span>
        </Pressable>
      </div>
    </div>
  );
}
