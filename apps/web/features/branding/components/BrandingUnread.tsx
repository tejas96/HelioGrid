import type { BrandingWords } from '@heliogrid/i18n';
import { Banner, BannerAction, type FocusAfter, Text } from '@heliogrid/ui';

/**
 * The page when a read got no answer: its title and the failure with *Try again*, nothing to edit
 * — an editor over facts it never read would save over them. *Try again* leaves with the failure;
 * focus goes to `focusAfter`, the page that stays.
 */
export function BrandingUnread({
  title,
  words,
  onTryAgain,
  focusAfter,
}: {
  title: string;
  words: Pick<BrandingWords, 'unread' | 'tryAgain'>;
  onTryAgain: () => void;
  focusAfter: FocusAfter;
}) {
  return (
    <>
      <Text as="h1" variant="h2">
        {title}
      </Text>
      <Banner
        kind="validation"
        density="functional"
        title={words.unread}
        action={
          <BannerAction onClick={onTryAgain} focusAfter={focusAfter}>
            {words.tryAgain}
          </BannerAction>
        }
      />
    </>
  );
}
