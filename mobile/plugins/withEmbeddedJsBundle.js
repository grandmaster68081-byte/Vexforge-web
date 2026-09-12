const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * VEXFORGE — the CI pipeline ships an `assembleDebug` APK. By default the React
 * Native Gradle plugin skips bundling JS for debuggable variants, so the installed
 * app looks for a Metro server and shows "Unable to load script".
 * Clearing `debuggableVariants` forces the JS bundle + assets to be embedded in
 * every variant, making the APK standalone.
 */
module.exports = function withEmbeddedJsBundle(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes("debuggableVariants")) {
      contents = contents.replace(
        /react\s*\{/,
        'react {\n    // VEXFORGE: embed the JS bundle in every variant (no Metro required)\n    debuggableVariants = []',
      );
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
};
