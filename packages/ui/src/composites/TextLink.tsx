'use client';
import type { MouseEventHandler, ReactNode } from 'react';
import './TextLink.css';

/**
 * Composition allowlist: href, onClick, children. Inline accent text-link (login.md §4):
 * not Button ghost — the pill is the wrong shape inside prose. With `href` renders an
 * <a>, otherwise a <button>; same look, base.css focus ring on both.
 */
export interface TextLinkProps {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  children: ReactNode;
}

export function TextLink({ href, onClick, children }: TextLinkProps) {
  if (href !== undefined) {
    return (
      <a className="ui-text-link" href={href} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className="ui-text-link" onClick={onClick}>
      {children}
    </button>
  );
}
