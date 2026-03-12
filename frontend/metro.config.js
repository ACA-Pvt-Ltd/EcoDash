const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Performance optimizations for production builds
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Enable inline requires for better performance
  inlineRequires: true,
};

// Optimize resolver
config.resolver = {
  ...config.resolver,
  // Speed up module resolution
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
};

module.exports = config;
