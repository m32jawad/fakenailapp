const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: {
      sourceExts,
      assetExts
    }
  } = await getDefaultConfig();

  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: false,
        },
      }),
    },
    resolver: {
      assetExts: [...assetExts, 'bin'],  // Add other file extensions as needed
      sourceExts: [...sourceExts, 'js', 'json', 'ts', 'tsx'],  // Add TypeScript extensions if you're using TypeScript
    },
  };
})();
