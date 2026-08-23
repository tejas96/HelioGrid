/*
 * ONE STORE, NOT ONE COPY PER CALLER. High-contrast field mode (F7-16) has two live consumers on the
 * same screen — the sun button in the top bar and the settings row — and `FieldModeToggle.set` is a
 * documented third route. With `useState` alone each caller held an independent copy whose
 * initializer ran once: tapping the sun turned the mode on and wrote <html data-field-mode="on">,
 * while the settings switch still rendered unchecked on a screen visibly in field mode. A global
 * capability needs a global store, so this module is it: every mounted consumer subscribes through
 * `useSyncExternalStore`, and every route to a change goes through `apply`.
 *
 * It is a PRODUCT CAPABILITY, not a styling variant, which is why the mode is one attribute on
 * <html> (it reaches every component through the token layer, with no field-mode prop anywhere) and
 * why it persists — the roof does not stop being sunny between screens.
 */

const ATTR = 'data-field-mode';
const KEY = 'hg-field-mode';

const subs = new Set<() => void>();
let current: boolean | null = null;

function read(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  if (document.documentElement.getAttribute(ATTR) === 'on') {
    return true;
  }
  try {
    return window.localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

/** The store's value — resolved from the DOM/localStorage once, then owned here. */
export function getFieldMode(): boolean {
  if (current === null) {
    current = read();
  }
  return current;
}

/** The server has no <html> to read and no storage; the mode starts off. */
export function getServerFieldMode(): boolean {
  return false;
}

/**
 * Set the mode without the switch — a settings screen, a deep link, a QA harness. Every mounted
 * consumer re-renders, because the store is this module and not each caller's `useState`.
 */
export function setFieldMode(on: boolean): void {
  const next = on === true;
  current = next;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(ATTR, next ? 'on' : 'off');
    try {
      window.localStorage.setItem(KEY, next ? 'on' : 'off');
    } catch {
      /* private mode */
    }
  }
  for (const fn of subs) {
    fn();
  }
}

/* Two outside routes to the same fact, watched so the store cannot fall behind the page: another
   tab (storage), and anything that writes the attribute directly — a deep link's inline script, a
   QA harness, a specimen card. Installed with the first subscriber, torn down with the last. */
let watching: (() => void) | null = null;

function watch(): void {
  if (watching !== null || typeof document === 'undefined') {
    return;
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY && (event.newValue === 'on') !== getFieldMode()) {
      setFieldMode(event.newValue === 'on');
    }
  };
  window.addEventListener('storage', onStorage);
  let mo: MutationObserver | null = null;
  if (typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver(() => {
      const domOn = document.documentElement.getAttribute(ATTR) === 'on';
      if (domOn !== getFieldMode()) {
        setFieldMode(domOn);
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
  }
  watching = () => {
    window.removeEventListener('storage', onStorage);
    mo?.disconnect();
  };
}

/** Subscribe a consumer. The DOM may not carry the persisted answer yet on a page's first mount. */
export function subscribeFieldMode(onStoreChange: () => void): () => void {
  subs.add(onStoreChange);
  watch();
  if (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute(ATTR) !== (getFieldMode() ? 'on' : 'off')
  ) {
    setFieldMode(getFieldMode());
  }
  return () => {
    subs.delete(onStoreChange);
    if (subs.size === 0 && watching !== null) {
      watching();
      watching = null;
    }
  };
}
