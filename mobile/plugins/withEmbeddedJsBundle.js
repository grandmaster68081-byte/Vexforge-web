const { withAppBuildGradle } = require('@expo/config-plugins');

function ensureEmbeddedJsBundle(contents) {
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  const lines = contents.split(/\r?\n/);
  const reactStart = lines.findIndex((line) => /^[ \t]*react\s*\{\s*(?:\/\/.*)?$/.test(line));

  if (reactStart === -1) {
    throw new Error('Could not find the Android Gradle react block for JS bundle configuration.');
  }

  const reactIndent = lines[reactStart].match(/^[ \t]*/)[0];
  const reactEnd = lines.findIndex(
    (line, index) => index > reactStart && line === `${reactIndent}}`,
  );

  if (reactEnd === -1) {
    throw new Error('Could not find the end of the Android Gradle react block.');
  }

  const body = lines.slice(reactStart + 1, reactEnd).filter((line) => {
    const isBundleSetting = /^[ \t]*(?:\/\/[ \t]*)?debuggableVariants\s*=/.test(line);
    const isBundleMarker = /^[ \t]*\/\/ VEXFORGE: embed the JS bundle in every variant/.test(line);
    return !isBundleSetting && !isBundleMarker;
  });

  const result = [
    ...lines.slice(0, reactStart + 1),
    `${reactIndent}    // VEXFORGE: embed the JS bundle in every variant (no Metro required)`,
    `${reactIndent}    debuggableVariants = []`,
    ...body,
    ...lines.slice(reactEnd),
  ].join(newline);

  const activeSettings = result
    .split(/\r?\n/)
    .slice(reactStart + 1, reactStart + 3 + body.length)
    .filter((line) => /^[ \t]*debuggableVariants\s*=/.test(line));

  if (activeSettings.length !== 1 || !/^[ \t]*debuggableVariants\s*=\s*\[\s*\]\s*$/.test(activeSettings[0])) {
    throw new Error('Android Gradle must bundle JavaScript for every variant.');
  }

  return result;
}

/**
 * VEXFORGE build compatibility plugin.
 * The canonical main build embeds the React Native JS bundle in every variant
 * so the standalone APK does not depend on a Metro development server.
 */
module.exports = function withEmbeddedJsBundle(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureEmbeddedJsBundle(cfg.modResults.contents);
    return cfg;
  });
};

module.exports.ensureEmbeddedJsBundle = ensureEmbeddedJsBundle;
