import fs from 'node:fs';import path from 'node:path';
const p=path.join(process.cwd(),'src/components/InAppBrowser.tsx');
if(fs.existsSync(p)){let t=fs.readFileSync(p,'utf8');t=t.replace(/setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g,'setYtSearchResults(results);').replace(/setYtSearchResults\(INITIAL_YT_VIDEOS\);/g,'setYtSearchResults([]);');fs.writeFileSync(p,t)}
console.log('[fix-youtube-search] complete');
