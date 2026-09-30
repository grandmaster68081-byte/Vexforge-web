import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const failures=[];
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'BUILD_MANIFEST.json'),'utf8'));
const required=[
  'src/core/runtimeGuards.ts','src/engine/battleDirector.ts','src/services/mutationGate.ts',
  'src/services/socialLiveSync.ts','src/render/VexforgeImage.tsx','docs/FINAL_RELEASE_AUDIT_1.10.0.md',
  'docs/FINAL_SHIP_CONTRACT_1.10.0.md','docs/OFFICIAL_CONTENT_CLOSURE_1.10.json'
];
for(const f of required) if(!fs.existsSync(path.join(root,f))) failures.push(`missing:${f}`);
if(pkg.version!=='1.10.0') failures.push(`package:${pkg.version}`);
if(app.expo?.version!=='1.10.0') failures.push(`app:${app.expo?.version}`);
if(app.expo?.android?.versionCode!==11) failures.push(`versionCode:${app.expo?.android?.versionCode}`);
if(app.expo?.runtimeVersion?.policy!=='appVersion') failures.push('runtime-policy');
if(pkg.dependencies?.['expo-router']!=='6.0.24') failures.push(`expo-router:${pkg.dependencies?.['expo-router']}`);
if(manifest.release!=='1.10.0') failures.push(`manifest:${manifest.release}`);
const files=[]; const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(['node_modules','.expo','.git'].includes(e.name))continue;if(e.isDirectory())walk(full);else if(/\.(ts|tsx|js|jsx)$/.test(e.name))files.push(full);}};
walk(path.join(root,'app')); walk(path.join(root,'src'));
const code=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
if(code.includes("this.rpc('vexforge_contribute_raid'")) failures.push('legacy-direct-raid-contribution-present');
for(const f of ['src/services/repository.ts','src/services/economy.ts']){ if(fs.existsSync(path.join(root,f))){ const body=fs.readFileSync(path.join(root,f),'utf8'); if(body.includes('tacticalInteractive')||body.includes('tacticalLabEngine')) failures.push(`authoritative-service-imports-local-engine:${f}`); }}
const forbidden=['Aether Prime','Bosque Eterno','Ciudad Mecánica','Tierras Sombrías','Frontera del Vacío','Paladines de Aether','Legión Umbral','Sindicato Mecánico','Hijos del Vacío','Guardianes Primordiales'];
for(const t of forbidden) if(code.includes(t)) failures.push(`superseded-lore:${t}`);
if(code.includes("eq('season_key','S1_2026')")) failures.push('hardcoded-season');
const gateMethods=['saveDeck','storeFormation','resolveBattle','forfeitBattle','claimDailyQuest','joinRaid','claimSeasonTier','createListing','buyListing','cancelListing','submitDeposit','requestWithdrawal','buyPack','openPack','createShopOrder','submitShopPayment','fusion','evolve'];
const repo=fs.readFileSync(path.join(root,'src/services/repository.ts'),'utf8');
for(const method of gateMethods){const at=repo.indexOf(`async ${method}`);if(at<0){failures.push(`missing-method:${method}`);continue;}const chunk=repo.slice(at,at+900);if(!chunk.includes('withMutationGate'))failures.push(`mutation-not-gated:${method}`);}
const socialMutations=['socialFriendRequest','socialRespond','socialSendMessage','socialMarkRead','socialSendGlobal','socialCreateClan','socialJoinClan','socialSendClan','socialPresence','updateSettings','tutorialStep'];
for(const method of socialMutations){const at=repo.indexOf(`async ${method}`);if(at<0){failures.push(`missing-social-method:${method}`);continue;}const chunk=repo.slice(at,at+850);if(!chunk.includes('withMutationGate'))failures.push(`social-not-gated:${method}`);}
const scenesDir=path.join(root,'assets/vexforge/scenes'); const cineDir=path.join(root,'assets/vexforge/cinematics');
const sceneCount=fs.existsSync(scenesDir)?fs.readdirSync(scenesDir).filter(x=>x.endsWith('.jpg')).length:0;
const cineCount=fs.existsSync(cineDir)?fs.readdirSync(cineDir).filter(x=>x.endsWith('.jpg')).length:0;
if(sceneCount<13) failures.push(`scene-count:${sceneCount}`); if(cineCount<8) failures.push(`cinematic-count:${cineCount}`);
const content=JSON.parse(fs.readFileSync(path.join(root,'docs/OFFICIAL_CONTENT_CLOSURE_1.10.json'),'utf8'));
if(content.scenes?.length!==13) failures.push('content-scenes'); if(content.cinematics?.length!==8) failures.push('content-cinematics');
console.log(JSON.stringify({ok:!failures.length,release:pkg.version,expoRouter:pkg.dependencies['expo-router'],sceneCount,cinematicCount:cineCount,codeFiles:files.length,failures},null,2));
process.exitCode=failures.length?1:0;
