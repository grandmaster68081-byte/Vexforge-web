import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const gradlePath = 'android/app/build.gradle';
let source = readFileSync(gradlePath, 'utf8');
const marker = '\n    buildTypes {';

if (!source.includes('signingConfigs.release')) {
  if (!source.includes(marker)) {
    throw new Error('Could not locate the generated Android buildTypes block.');
  }
  const releaseConfig = `
    signingConfigs {
        release {
            storeFile file(VEXFORGE_UPLOAD_STORE_FILE)
            storePassword VEXFORGE_UPLOAD_STORE_PASSWORD
            keyAlias VEXFORGE_UPLOAD_KEY_ALIAS
            keyPassword VEXFORGE_UPLOAD_KEY_PASSWORD
        }
    }
`;
  source = source.replace(marker, `${releaseConfig}${marker}`);
}

const buildTypesIndex = source.indexOf('buildTypes {');
const releaseIndex = source.indexOf('release {', buildTypesIndex);
if (releaseIndex === -1) throw new Error('Could not locate release build type.');
const releaseTail = source.slice(releaseIndex);
const signingMarker = 'signingConfig signingConfigs.debug';
const signingIndex = releaseTail.indexOf(signingMarker);
if (signingIndex === -1) throw new Error('Could not locate release signing assignment.');
const absoluteSigningIndex = releaseIndex + signingIndex;
source = `${source.slice(0, absoluteSigningIndex)}signingConfig signingConfigs.release${source.slice(absoluteSigningIndex + signingMarker.length)}`;
writeFileSync(gradlePath, source);

if (!existsSync('android/gradle.properties')) throw new Error('Android Gradle properties file is missing.');
if (!readFileSync(gradlePath, 'utf8').includes('signingConfigs.release')) throw new Error('Release signing configuration was not installed.');
console.log('OK: release signing configuration installed');
