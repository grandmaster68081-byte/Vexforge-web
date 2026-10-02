const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { withDangerousMod } = require('@expo/config-plugins');

module.exports = function withCriticalPngAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const { projectRoot, platformProjectRoot } = modConfig.modRequest;
      const { criticalAssets } = await import(
        pathToFileURL(path.join(projectRoot, 'scripts', 'critical-assets.mjs')).href
      );
      const pngAssets = criticalAssets.filter(
        (assetPath) => assetPath.startsWith('assets/vexforge/') && assetPath.endsWith('.png'),
      );

      if (pngAssets.length !== 9) {
        throw new Error(`Expected 9 official VEXFORGE support PNGs, found ${pngAssets.length}.`);
      }

      const destinationRoot = path.join(
        platformProjectRoot,
        'app',
        'src',
        'main',
        'assets',
        'vexforge-critical',
      );
      fs.rmSync(destinationRoot, { recursive: true, force: true });
      fs.mkdirSync(destinationRoot, { recursive: true });

      for (const assetPath of pngAssets) {
        const sourcePath = path.join(projectRoot, assetPath);
        const destinationPath = path.join(destinationRoot, path.basename(assetPath));
        fs.copyFileSync(sourcePath, destinationPath);
      }

      return modConfig;
    },
  ]);
};