const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const realProjectRoot = fs.realpathSync(projectRoot);

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), realProjectRoot, path.dirname(realProjectRoot)]));
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
