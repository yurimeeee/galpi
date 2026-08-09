const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/**
 * On web, package.json "exports" resolution picks zustand's `import`
 * condition (its ESM build), which contains an unguarded `import.meta.env`
 * check for Vite compat. Metro's web bundle is a classic (non-module)
 * script, so that token makes the *entire* bundle fail to parse. Forcing
 * zustand's resolution to skip the `import` condition lands on its plain
 * CJS build instead, which has no import.meta usage.
 */
const { resolveRequest } = config.resolver;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'zustand' || moduleName.startsWith('zustand/'))) {
    return (resolveRequest ?? context.resolveRequest)(
      { ...context, unstable_conditionNames: ['require', 'react-native'] },
      moduleName,
      platform,
    );
  }
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
