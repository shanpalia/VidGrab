import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'src','App.tsx');
let source=fs.readFileSync(file,'utf8');
if(!source.includes('vidgrab-native-grab')){
  const anchor=`  useEffect(() => {
    if (showSplash) return;`;
  const injected=`  useEffect(() => {
    const onNativeGrab = async (event: Event) => {
      const url = String((event as CustomEvent<{url?: string}>).detail?.url || '').trim();
      if (!url) return;
      setNativeBrowserOpen(false);
      setErrorMessage(undefined);
      await handleGrab(url);
    };
    window.addEventListener('vidgrab-native-grab', onNativeGrab);
    return () => window.removeEventListener('vidgrab-native-grab', onNativeGrab);
  }, []);

  useEffect(() => {
    if (showSplash) return;`;
  if(!source.includes(anchor))throw new Error('Clipboard effect anchor not found');
  source=source.replace(anchor,injected);
}
fs.writeFileSync(file,source);
console.log('[grab] native browser GRAB event wired to VidGrab metadata/download flow');
