import { subjectAddressOf } from '@heliogrid/domain';
import { Linking } from 'react-native';
import { onPushOpened, type PushSubject, pushThatOpenedTheApp } from '../push/messaging';

/**
 * Container-level deep linking.
 *
 * PATHS THEMSELVES LIVE ON EACH ROUTE (`linking: 'leads/:leadId'` on the route), so a route
 * and its URL are one edit and cannot drift apart. Only the prefixes are global, and they
 * belong here rather than in `App.tsx` — the entry file composes providers and knows nothing
 * about routes.
 *
 * `enabled: 'auto'` is deliberately NOT used. It would auto-generate a kebab-case path for
 * every leaf screen, which means renaming a route silently changes a public URL. Deep-link
 * paths are a contract with whatever sent the link; each one is declared on purpose.
 *
 * A tapped push does NOT arrive as a URL — it hands back a data payload. `getInitialURL` and
 * `subscribe` turn its subject into the address its screen has (`subjectAddressOf`), so a push
 * reuses this same route table (`F6-02`).
 */
const PREFIX = 'heliogrid://';

function linkOf(subject: PushSubject | null): string | null {
  const address = subjectAddressOf(subject?.subjectKind);
  return address === null ? null : `${PREFIX}${address}`;
}

export const linkingOptions = {
  prefixes: [PREFIX],
  async getInitialURL(): Promise<string | null> {
    return (await Linking.getInitialURL()) ?? linkOf(await pushThatOpenedTheApp());
  },
  subscribe(listener: (url: string) => void): () => void {
    const links = Linking.addEventListener('url', ({ url }) => listener(url));
    const pushes = onPushOpened((subject) => {
      const url = linkOf(subject);
      if (url !== null) listener(url);
    });
    return () => {
      links.remove();
      pushes();
    };
  },
};
