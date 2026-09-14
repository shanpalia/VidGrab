import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'VidGrabBrowserActivity.java');
if (!fs.existsSync(file)) throw new Error('VidGrabBrowserActivity.java not found');

let text = fs.readFileSync(file, 'utf8');
// Keep the browser patcher insertion point stable after the V3 generator adds its note.
text = text.replace(
  'toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        // GRAB is added by native-browser-grab.mjs.\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));',
  'toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));'
);

// Keep both legacy and current markers so older source verification remains compatible.
if (text.includes('VIDGRAB_NATIVE_BROWSER_V3') && !text.includes('VIDGRAB_NATIVE_BROWSER_V2')) {
  text = text.replace('// VIDGRAB_NATIVE_BROWSER_V3', '// VIDGRAB_NATIVE_BROWSER_V2\n// VIDGRAB_NATIVE_BROWSER_V3');
}

fs.writeFileSync(file, text);
console.log('[fix-native-browser-source] generated browser normalized for GRAB patching');
