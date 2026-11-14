import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ProposalPictureProps } from './ProposalPicture.types';
import { pictureAddress } from './picture-files';

interface WebProposalPictureProps extends ProposalPictureProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A proposal picture filling the box its caller gives it. The picture is decoration, hidden from a
 * screen reader; with no file to draw, the soft sky under it shows. Words over it take the fixed
 * white ink on the shade, in light and dark alike (`[data-paper]`): a photograph does not follow
 * the scheme.
 */
export function ProposalPicture({
  name,
  src,
  shade = 'none',
  children,
  className,
  style,
}: WebProposalPictureProps) {
  const address = src ?? (name === undefined ? undefined : pictureAddress(name));
  return (
    <div className={classNames('hg-proposal-picture', className)} data-paper="" style={style}>
      {address === undefined ? null : (
        <img className="hg-proposal-picture-file" src={address} alt="" decoding="async" />
      )}
      {shade === 'none' ? null : (
        <span className="hg-proposal-picture-shade" data-shade={shade} aria-hidden="true" />
      )}
      {children === undefined ? null : <div className="hg-proposal-picture-over">{children}</div>}
    </div>
  );
}
