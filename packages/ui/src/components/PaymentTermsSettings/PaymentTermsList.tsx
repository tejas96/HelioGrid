import { Text } from '../../primitives/Text/Text';
import { AllocationMeter } from '../AllocationMeter/AllocationMeter';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner/Banner';
import { BannerAction } from '../Banner/BannerAction';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { useRetryFocus } from '../CatalogItems/use-retry-focus';
import { Badge } from '../Chip/Chip';
import { IconButton } from '../IconButton/IconButton';
import { LoadingBars } from '../LoadingBars/LoadingBars';
import type { PaymentTermsCardView, PaymentTermsListProps } from './PaymentTermsSettings.types';

/**
 * The Payment terms page (`SCR-M01-20` m20-a, m20-f): the saved line, the head with the archive
 * button and *Add payment terms*, a card per template that shows its split, and the closing line.
 * The archived view swaps the cards for the archived ones, each with *Restore* (m20-n8).
 */
export function PaymentTermsList(props: PaymentTermsListProps) {
  const { read, title } = props;
  return (
    <div
      className="hg-pay"
      data-columns={props.columns}
      data-paired={props.aside === undefined ? undefined : 'true'}
    >
      <div className="hg-pay-head" data-titled={title === undefined ? undefined : 'true'}>
        {title === undefined ? null : (
          <Text as="h1" variant="h2" bold>
            {title}
          </Text>
        )}
        {read.kind === 'ready' && props.savedLine !== undefined ? (
          <Text variant="caption" color="secondary" className="hg-pay-pretty">
            {props.savedLine}
          </Text>
        ) : null}
      </div>
      {props.aside === undefined ? (
        <ListBody {...props} />
      ) : (
        <div className="hg-pay-pair">
          <div className="hg-pay-main">
            <ListBody {...props} />
          </div>
          {props.aside}
        </div>
      )}
    </div>
  );
}

function ListBody(props: PaymentTermsListProps) {
  const { words } = props;
  const focus = useRetryFocus(props.read.kind);
  if (props.read.kind === 'loading') {
    return <LoadingBars label={words.loading} bars={['panel', 'panel', 'panel']} />;
  }
  if (props.read.kind === 'failed') {
    return (
      <Banner
        kind="validation"
        density="functional"
        title={words.unreadTitle}
        action={
          <BannerAction onClick={focus.retrying(props.read.retry)}>{words.tryAgain}</BannerAction>
        }
      />
    );
  }
  return (
    <>
      {props.teaching && !props.archived ? (
        <Banner kind="preliminary" density="functional" title={words.seededTitle}>
          {words.seededBody}
        </Banner>
      ) : null}
      <section
        className="hg-pay-terms"
        aria-label={props.archived ? words.archivedTitle : words.yourTerms}
      >
        <div className="hg-pay-terms-head">
          <div ref={focus.target} tabIndex={-1}>
            <Text as="h2" variant="body-sm" bold className="hg-pay-pretty">
              {props.archived ? words.archivedTitle : words.yourTerms}
            </Text>
          </div>
          <div className="hg-pay-terms-acts">
            <Button
              variant={props.archived ? 'secondary' : 'ghost'}
              size="sm"
              icon={<ShellGlyph name="archive" size="sm" />}
              expanded={props.archived}
              spokenName={words.archivedCount(props.archivedCount)}
              onClick={props.onToggleArchived}
            >
              {String(props.archivedCount)}
            </Button>
            {props.archived ? null : (
              <IconButton label={words.addTerms} size={36} variant="surface" onClick={props.onAdd}>
                <ShellGlyph name="plus" size="sm" />
              </IconButton>
            )}
          </div>
        </div>
        {props.archived ? (
          <Text variant="caption" color="secondary" className="hg-pay-pretty">
            {props.cards.length === 0 ? words.nothingArchived : words.archivedCaption}
          </Text>
        ) : null}
        <div className="hg-pay-cards">
          {props.cards.map((card) => (
            <TermsCard key={card.id} card={card} {...props} />
          ))}
        </div>
      </section>
      {props.archived ? null : (
        <Text variant="caption" color="secondary" align="center" className="hg-pay-pretty">
          {words.closing}
        </Text>
      )}
    </>
  );
}

function TermsCard({
  card,
  words,
  archived,
  onOpen,
  onRestore,
}: PaymentTermsListProps & { card: PaymentTermsCardView }) {
  const opens = !archived;
  return (
    <Card
      surface="raised"
      density="functional"
      interactive={opens}
      selected={card.selected}
      {...(opens ? { label: card.label, onClick: () => onOpen(card.id) } : {})}
    >
      <div className="hg-pay-card">
        <div className="hg-pay-card-top">
          <div className="hg-pay-card-name">
            <Text variant="body-sm" bold className="hg-pay-grow hg-pay-pretty">
              {card.name}
            </Text>
            {opens ? (
              <ShellGlyph name="chevron-right" size="md" tone="secondary" />
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<ShellGlyph name="undo" size="sm" />}
                spokenName={words.restoreName(card.name)}
                onClick={() => onRestore(card.id)}
              >
                {words.restore}
              </Button>
            )}
          </div>
          {card.isDefault || card.platformStandard ? (
            <div className="hg-pay-marks">
              {card.isDefault ? (
                <Badge tone="accent" density="functional">
                  {words.defaultMark}
                </Badge>
              ) : null}
              {card.platformStandard ? (
                <Badge tone="neutral" density="functional">
                  {words.platformStandard}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
        <AllocationMeter
          variant="split"
          density="functional"
          label={words.split(card.name)}
          parts={card.parts.map((part) => ({
            label: part.label,
            value: part.share,
            caption: part.stage,
          }))}
        />
      </div>
    </Card>
  );
}
