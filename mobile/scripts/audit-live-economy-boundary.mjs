import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const failures=[];
const forbiddenLivePatterns=[
  /marketFee\(/,
  /MARKET_FEE_RATE\s*=\s*0\./,
  /price_vex\s*[:=]\s*\d/,
  /price_usdt\s*[:=]\s*\d/,
  /rarity_weights\s*[:=]\s*\{/,
];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,e.name);
    if(e.name==='node_modules'||e.name==='.expo'||e.name==='.git') continue;
    if(e.isDirectory()) walk(full);
    else if(/\.(ts|tsx|js|jsx)$/.test(e.name)){
      const rel=path.relative(root,full).replaceAll('\\','/');
      if(rel.startsWith('src/audits/')||rel.startsWith('src/economy/')) continue;
      const body=fs.readFileSync(full,'utf8');
      for(const rx of forbiddenLivePatterns) if(rx.test(body)) failures.push(`${rel}:${rx}`);
    }
  }
}
walk(path.join(root,'app')); walk(path.join(root,'src'));
console.log(JSON.stringify({ok:!failures.length,failures},null,2));
process.exitCode=failures.length?1:0;
