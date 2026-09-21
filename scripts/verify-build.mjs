import { existsSync, readFileSync } from 'node:fs';

if (!existsSync('dist/index.html')) throw new Error('dist/index.html missing');
if (!existsSync('dist/_redirects')) throw new Error('dist/_redirects missing');
const html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('VEXFORGE')) throw new Error('VEXFORGE title marker missing from build');
console.log('PORTAL BUILD PASS');
