import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(file)) throw new Error('MainActivity.java not found');
let source = fs.readFileSync(file, 'utf8');

source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V5', 'VIDGRAB_ANDROID_SAFE_AREA_V7');
source = source.replace('getWindow().setDecorFitsSystemWindows(true);', 'getWindow().setDecorFitsSystemWindows(false);');

if (!source.includes('VIDGRAB_ANDROID_INSETS_V7')) {
  const old = 'bridge.getWebView().setPadding(0, 0, 0, 0);';
  const replacement = `${old}
            // VIDGRAB_ANDROID_INSETS_V7: reserve status/cutout/navigation bars explicitly.
            bridge.getWebView().setOnApplyWindowInsetsListener((view, insets) -> {
                int top;
                int bottom;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    android.graphics.Insets bars = insets.getInsets(
                        android.view.WindowInsets.Type.statusBars()
                        | android.view.WindowInsets.Type.displayCutout()
                        | android.view.WindowInsets.Type.navigationBars());
                    top = bars.top;
                    bottom = bars.bottom;
                } else {
                    top = insets.getSystemWindowInsetTop();
                    bottom = insets.getSystemWindowInsetBottom();
                }
                view.setPadding(0, top, 0, bottom);
                return insets;
            });
            bridge.getWebView().requestApplyInsets();`;
  source = source.replace(old, replacement);
}

if (!source.includes('getClipboardText()')) {
  const anchor = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const method = `    @JavascriptInterface\n    public String getClipboardText() {\n        try {\n            android.content.ClipboardManager cm = (android.content.ClipboardManager) activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);\n            if (cm == null || !cm.hasPrimaryClip()) return \"\";\n            android.content.ClipData clip = cm.getPrimaryClip();\n            if (clip == null || clip.getItemCount() == 0) return \"\";\n            CharSequence text = clip.getItemAt(0).coerceToText(activity);\n            return text == null ? \"\" : text.toString();\n        } catch (Exception e) { return \"\"; }\n    }\n\n`;
  source = source.replace(anchor, method + anchor);
}

fs.writeFileSync(file, source);
console.log('[native] VidGrab safe-area V7 and clipboard bridge applied');
