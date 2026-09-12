import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const browser=path.join(root,'src/components/InAppBrowser.tsx');
if(fs.existsSync(browser)){
 let text=fs.readFileSync(browser,'utf8');
 text=text.replace(/setYtSearchResults\(results\.length > 0 \? results : INITIAL_YT_VIDEOS\);/g,'setYtSearchResults(results);');
 text=text.replace(/setYtSearchResults\(INITIAL_YT_VIDEOS\);/g,'setYtSearchResults([]);');
 fs.writeFileSync(browser,text);
}
console.log('[fix-youtube-search] production search fallback patch applied');
