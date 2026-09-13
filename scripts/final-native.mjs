import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(file)) throw new Error('MainActivity.java not found');
let source = fs.readFileSync(file, 'utf8');

source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V5', 'VIDGRAB_ANDROID_SAFE_AREA_V8');
source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V7', 'VIDGRAB_ANDROID_SAFE_AREA_V8');
source = source.replace('getWindow().setDecorFitsSystemWindows(true);', 'getWindow().setDecorFitsSystemWindows(false);');

// Keep the Android system bars visually separate from the app content.
// The status bar remains visible like VidMate, but the WebView never draws under it.
if (!source.includes('VIDGRAB_ANDROID_SYSTEM_BARS_V8')) {
  const anchor = '        bridge.getWebView().setPadding(0, 0, 0, 0);';
  const replacement = `${anchor}\n            // VIDGRAB_ANDROID_SYSTEM_BARS_V8: stable status/navigation bar appearance.\n            getWindow().setStatusBarColor(android.graphics.Color.rgb(248, 250, 252));\n            getWindow().setNavigationBarColor(android.graphics.Color.rgb(248, 250, 252));\n            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {\n                getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);\n            }`;
  source = source.replace(anchor, replacement);
}

if (!source.includes('VIDGRAB_ANDROID_INSETS_V8')) {
  source = source.replace('VIDGRAB_ANDROID_INSETS_V7', 'VIDGRAB_ANDROID_INSETS_V8');
}

if (!source.includes('setOnApplyWindowInsetsListener')) {
  const old = 'bridge.getWebView().setPadding(0, 0, 0, 0);';
  const replacement = `${old}\n            // VIDGRAB_ANDROID_INSETS_V8: reserve status/cutout/navigation bars explicitly.\n            bridge.getWebView().setOnApplyWindowInsetsListener((view, insets) -> {\n                int top;\n                int bottom;\n                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                    android.graphics.Insets bars = insets.getInsets(\n                        android.view.WindowInsets.Type.statusBars()\n                        | android.view.WindowInsets.Type.displayCutout()\n                        | android.view.WindowInsets.Type.navigationBars());\n                    top = bars.top;\n                    bottom = bars.bottom;\n                } else {\n                    top = insets.getSystemWindowInsetTop();\n                    bottom = insets.getSystemWindowInsetBottom();\n                }\n                view.setPadding(0, top, 0, bottom);\n                return insets;\n            });\n            bridge.getWebView().requestApplyInsets();`;
  source = source.replace(old, replacement);
}

if (!source.includes('getClipboardText()')) {
  const anchor = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const method = `    @JavascriptInterface\n    public String getClipboardText() {\n        try {\n            android.content.ClipboardManager cm = (android.content.ClipboardManager) activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);\n            if (cm == null || !cm.hasPrimaryClip()) return \"\";\n            android.content.ClipData clip = cm.getPrimaryClip();\n            if (clip == null || clip.getItemCount() == 0) return \"\";\n            CharSequence text = clip.getItemAt(0).coerceToText(activity);\n            return text == null ? \"\" : text.toString();\n        } catch (Exception e) { return \"\"; }\n    }\n\n`;
  source = source.replace(anchor, method + anchor);
}

fs.writeFileSync(file, source);
console.log('[native] VidGrab Android system-bar/content bounds V8 applied');
