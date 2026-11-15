const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const workspaceRoot = path.resolve(__dirname, '../..');
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Monorepo + Lingui wiring (verified bare-RN requirements):
 * watchFolders/nodeModulesPaths make pnpm workspace packages resolvable.
 */
/**
 * A picture that lives in a workspace package sits above this folder, so the app asks the dev
 * server for `/assets/../../packages/…`, and the server folds the `..` away before it looks for the
 * file. Metro reads a path above the project only from `unstable_path`; without this rewrite every
 * such picture is a 404 in a dev build. A release bundle copies its pictures and never asks.
 */
const ASSET_ABOVE_PROJECT = /^((?:https?:\/\/[^/]+)?\/assets\/)((?:\.\.\/)+.*)$/;

const config = {
  watchFolders: [workspaceRoot],
  server: {
    // A `+` (pnpm's folder names hold one) would be read as a space once the path is a query.
    rewriteRequestUrl: (url) =>
      url.replace(
        ASSET_ABOVE_PROJECT,
        (_, assets, above) => `${assets}?unstable_path=${above.replaceAll('+', '%2B')}`,
      ),
  },
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
