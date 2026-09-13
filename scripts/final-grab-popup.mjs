import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'src','App.tsx');
let source=fs.readFileSync(file,'utf8');

// The current Android flow shows the single VidMate-style GRAB confirmation
// natively inside VidGrabBrowserActivity. After GRAB, App.tsx must go directly
// to metadata/download options. Do not inject a second React popup here.
const nativeGrabHandler = `window.addEventListener('vidgrab-native-grab', onNativeGrab);`;
const directHandleGrab = `void handleGrab(url);`;
const nativePopupFlowPresent = source.includes(nativeGrabHandler) && source.includes(directHandleGrab);

if (nativePopupFlowPresent) {
  console.log('[grab-popup] native VidMate-style single GRAB popup already wired; no duplicate React popup injected');
  process.exit(0);
}

// Compatibility path for older source layouts: only add the React fallback
// popup when the old native flow is not present. This keeps the build patcher
// idempotent and prevents the stale error-toast anchor from breaking builds.
if (!source.includes('const [grabUrl, setGrabUrl]')) {
  const stateAnchor="  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);";
  if (!source.includes(stateAnchor)) throw new Error('Clipboard state anchor not found');
  source=source.replace(stateAnchor,stateAnchor+"\n  const [grabUrl, setGrabUrl] = useState<string | null>(null);");
}

const oldHandler=`    const onNativeGrab = async (event: Event) => {\n      const url = String((event as CustomEvent<{url?: string}>).detail?.url || '').trim();\n      if (!url) return;\n      setNativeBrowserOpen(false);\n      setErrorMessage(undefined);\n      await handleGrab(url);\n    };`;
const newHandler=`    const onNativeGrab = (event: Event) => {\n      const url = String((event as CustomEvent<{url?: string}>).detail?.url || '').trim();\n      if (!url) return;\n      setNativeBrowserOpen(false);\n      setActiveTab('home');\n      setErrorMessage(undefined);\n      setGrabUrl(url);\n    };`;
if(source.includes(oldHandler)) source=source.replace(oldHandler,newHandler);

if(!source.includes('Grab this media?')) {
  const anchor = source.includes("{errorMessage && <div className=\"fixed bottom-24")
    ? source.match(/\s*\{errorMessage && <div className=\"fixed bottom-24[\s\S]*?<\/div>\}/)?.[0]
    : null;
  if (!anchor) {
    console.log('[grab-popup] no legacy error-toast anchor found; leaving current App.tsx unchanged');
    process.exit(0);
  }
  const popup=`\n      {grabUrl && (\n        <div className="fixed inset-0 z-[210] bg-black/55 flex items-end sm:items-center justify-center p-4">\n          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">\n            <div className="px-6 pt-6 pb-4">\n              <div className="flex items-center gap-3">\n                <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-black">↓</div>\n                <div><h2 className="text-xl font-black text-gray-900">Grab this media?</h2><p className="text-sm text-gray-500 mt-0.5">Ready to download from this page</p></div>\n              </div>\n              <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 break-all line-clamp-3">{grabUrl}</div>\n            </div>\n            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">\n              <button onClick={() => setGrabUrl(null)} className="flex-1 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-600">CANCEL</button>\n              <button onClick={async () => { const url=grabUrl; setGrabUrl(null); if(url) await handleGrab(url); }} className="flex-1 rounded-xl bg-red-600 py-3.5 font-black text-white shadow-lg">GRAB</button>\n            </div>\n          </div>\n        </div>\n      )}`;
  source=source.replace(anchor,popup+anchor);
}

fs.writeFileSync(file,source);
console.log('[grab-popup] VidMate-style GRAB popup patch applied');
