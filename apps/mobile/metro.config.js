const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const workspaceRoot = path.resolve(__dirname, '../..');
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Monorepo + Lingui wiring (docs/research/verify-bareRn.md — verified bare-RN requirements):
 * 1. watchFolders/nodeModulesPaths make pnpm workspace packages resolvable.
 * 3. PowerSync (Track E) will ADD: inline-requires blockList for
 *    require.resolve('@powersync/react-native') + the WebSocket transport — skipping
 *    either produces runtime breakage, not build errors. Do not remove this note.
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
