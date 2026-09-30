const { withAppBuildGradle } = require('@expo/config-plugins');
/**
 * VEXFORGE build compatibility plugin.
 * The canonical main build embeds the React Native JS bundle in every variant
 * so the standalone APK does not depend on a Metro development server.
 */
module.exports = function withEmbeddedJsBundle(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('debuggableVariants')) {
      contents = contents.replace(
        /react\s*\{/,
        'react {\n    // VEXFORGE: embed the JS bundle in every variant (no Metro required)\n    debuggableVariants = []',
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
};
