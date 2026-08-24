const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const workspaceRoot = path.resolve(__dirname, '../..');
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Monorepo + Lingui wiring (verified bare-RN requirements):
 * watchFolders/nodeModulesPaths make pnpm workspace packages resolvable.
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
