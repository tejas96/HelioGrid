import type { CustomerLink, CustomerLinks } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { EmptyState, FailedRead } from '../EmptyState';
import { IconButton } from '../IconButton';
import { LoadingBars } from '../LoadingBars';
import { AfterHint, failedReadOf } from '../ProposalAfterParts';
import { riseOrder } from '../ProposalBlocks/ProposalBlocks.logic';
import { StatusChip } from '../StatusChip';
import { linkActsOf, revokeConfirmOf } from './ProposalLinks.logic';
import type { ProposalLinksProps } from './ProposalLinks.types';
import './ProposalLinks.css';

type RowVars = CSSProperties & Record<'--i', number>;

function LinkCard(
  props: ProposalLinksProps & { link: CustomerLink; order: number; mayRevoke: boolean },
) {
  const { link, words, failure, order } = props;
  const live = link.status === 'active';
  const vars: RowVars = { '--i': riseOrder(order) };
  return (
    <li className="hg-links-card" data-off={live ? undefined : ''} style={vars}>
      <span className="hg-links-face">
        <Avatar name={link.contact?.name ?? link.label} size={40} />
      </span>
      <span className="hg-links-words">
        <span className="hg-links-top">
          <b>{link.label}</b>
          <StatusChip
            status={link.status}
            label={words.status(link)}
            tone={live ? 'success' : 'neutral'}
            density="functional"
            glyph={
              <ShellGlyph
                name={live ? 'link' : 'link-off'}
                size="sm"
                tone={live ? 'success' : 'secondary'}
              />
            }
          />
        </span>
        <span>{words.who(link)}</span>
        <span>{words.line(link)}</span>
        {failure?.linkId === link.id ? (
          <Text variant="body-sm" color="danger" live>
            {failure.reason}
          </Text>
        ) : null}
      </span>
      {live ? (
        <span className="hg-links-acts">
          {linkActsOf(props, link, props.mayRevoke).map((act) => (
            <IconButton key={act.key} {...act.button}>
              <ShellGlyph name={act.glyph} size="sm" tone="primary" />
            </IconButton>
          ))}
        </span>
      ) : null}
    </li>
  );
}

/** Turn off takes the link's acts away: focus then lands on the page's `focusAfter`. */
function ConfirmYes(
  props: ProposalLinksProps & { yes: ReturnType<typeof revokeConfirmOf>['yes'] },
) {
  const leaving = useFocusAfter(props.focusAfter);
  return (
    <Button {...props.yes} onClick={leaving(props.yes.onClick)}>
      {props.words.confirmYes}
    </Button>
  );
}

function Confirm(props: ProposalLinksProps & { links: CustomerLinks['links'] }) {
  const confirm = revokeConfirmOf(props, props.links);
  return (
    <EditorSurface {...confirm.sheet} showClose desktop="modal">
      {confirm.link === undefined ? null : (
        <div className="hg-links-confirm">
          <Text variant="body" color="secondary">
            {props.words.confirmLine}
          </Text>
          <ConfirmYes {...props} yes={confirm.yes} />
          <Button {...confirm.no}>{props.words.confirmNo}</Button>
        </div>
      )}
    </EditorSurface>
  );
}

/** The deal's named links, on the web (`SCR-M06-20`). */
export function ProposalLinks(props: ProposalLinksProps) {
  const { read, words } = props;
  if (read.kind === 'loading') {
    return <LoadingBars bars={['row', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return <FailedRead {...failedReadOf(words, read.retry, props.focusAfter)} />;
  }
  const { links, acts } = read.value;
  return (
    <div className="hg-links">
      {links.length === 0 ? (
        <EmptyState scene="settle" title={words.noneTitle} description={words.noneLine} />
      ) : (
        <ul className="hg-links-cards">
          {links.map((link, index) => (
            <LinkCard key={link.id} {...props} link={link} order={index} mayRevoke={acts.revoke} />
          ))}
        </ul>
      )}
      <AfterHint glyph="eye-off">{words.hint}</AfterHint>
      <Confirm {...props} links={links} />
    </div>
  );
}
