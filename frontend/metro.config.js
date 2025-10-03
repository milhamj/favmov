const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('ttf')) {
  config.resolver.assetExts.push('ttf');
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('MaterialIcons.ttf')) {
    const redirectedPath = path.resolve(__dirname, 'assets/fonts/MaterialIcons.ttf');
    return context.resolveRequest(context, redirectedPath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

console.log('>>> Metro configured: .ttf bundled + MaterialIcons redirected to assets/fonts');

module.exports = config;