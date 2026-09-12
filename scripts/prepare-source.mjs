import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();
function patch(file,rx,repl){const p=path.join(root,file);if(!fs.existsSync(p))return;const t=fs.readFileSync(p,'utf8'),n=t.replace(rx,repl);if(n!==t)fs.writeFileSync(p,n)}
patch('src/components/InAppBrowser.tsx',/setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g,'setYtSearchResults(results);');
patch('src/components/InAppBrowser.tsx',/setYtSearchResults\(INITIAL_YT_VIDEOS\);/g,'setYtSearchResults([]);');
console.log('[prepare-source] complete');
