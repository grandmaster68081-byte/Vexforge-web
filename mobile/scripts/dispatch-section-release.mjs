const args = process.argv.slice(2);
const value = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const sectionId = value('--section-id');
const deliveryType = value('--delivery-type', 'OTA_UPDATE');
const channel = value('--channel', 'production');
const appVersion = value('--app-version', '1.0.0');
const runtimeVersion = value('--runtime-version', '1.0.0');
const message = value('--message', '');
if (!sectionId) throw new Error('Usage: node mobile/scripts/dispatch-section-release.mjs --section-id VE-MOB-X [options]');
if (!['OTA_UPDATE', 'NATIVE_PLAY_RELEASE'].includes(deliveryType)) throw new Error('Invalid delivery type');
if (!process.env.GITHUB_PAT) throw new Error('GITHUB_PAT is required through the secure environment');
const eventType = deliveryType === 'OTA_UPDATE' ? 'vexforge-section-release' : 'vexforge-native-release';
const response = await fetch('https://api.github.com/repos/grandmaster68081-byte/Vexforge-web/dispatches', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.GITHUB_PAT}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
  body: JSON.stringify({ event_type: eventType, client_payload: { section_id: sectionId, delivery_type: deliveryType, channel, app_version: appVersion, runtime_version: runtimeVersion, source_commit: process.env.SOURCE_COMMIT ?? '', message } }),
});
if (!response.ok) throw new Error(`GitHub release dispatch failed: ${response.status} ${await response.text()}`);
console.log(JSON.stringify({ dispatched: true, eventType, sectionId, deliveryType, channel }));
