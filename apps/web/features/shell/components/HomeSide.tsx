'use client';
import { BLOCK, homeGlanceWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { GlanceStrip, HomeBlocks } from '@heliogrid/ui';
import type { ComponentProps } from 'react';

type BlocksProps = ComponentProps<typeof HomeBlocks>;

/**
 * The home's side column: the day at a glance when it has two facts or more, then one block per
 * held preset. A column with neither is not drawn, so the main column takes the whole width.
 */
export function HomeSide({
  facts,
  blocks,
  read,
}: {
  facts: ComponentProps<typeof GlanceStrip>['facts'];
  blocks: Omit<BlocksProps, 'read' | 'loadingLabel'>;
  read: BlocksProps['read'];
}) {
  const t = useTranslate();
  const glance = facts.length >= 2;
  const held = blocks.blocks.length > 0;
  if (!glance && !held) return null;
  return (
    <div className="hg-home-side">
      {glance ? <GlanceStrip facts={facts} name={homeGlanceWords(t).name} /> : null}
      {held ? <HomeBlocks {...blocks} read={read} loadingLabel={t(BLOCK.loading)} /> : null}
    </div>
  );
}
