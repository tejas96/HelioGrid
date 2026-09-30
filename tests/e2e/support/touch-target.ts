// Playwright's component transform rewrites every name a spec imports from a module it mounts from,
// so a plain value imported beside a component fails to compile ("already declared"). A spec reads
// the product's touch floor from here instead of typing the number.
export { MIN_TOUCH_TARGET } from '@heliogrid/ui';
