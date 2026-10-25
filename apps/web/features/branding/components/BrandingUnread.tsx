import type { BrandingWords } from '@heliogrid/i18n';
import { Banner, BannerAction, Text } from '@heliogrid/ui';

/**
 * The page when a read got no answer: its title and the failure with *Try again*, nothing to edit
 * — an editor over facts it never read would save over them.
 */
export function BrandingUnread({
  title,
  words,
  onTryAgain,
}: {
  title: string;
  words: Pick<BrandingWords, 'unread' | 'tryAgain'>;
  onTryAgain: () => void;
}) {
  return (
    <div className="hg-shell-page">
      <Text as="h1" variant="h2">
        {title}
      </Text>
      <Banner
        kind="validation"
        density="functional"
        title={words.unread}
        action={<BannerAction onClick={onTryAgain}>{words.tryAgain}</BannerAction>}
      />
    </div>
  );
}
