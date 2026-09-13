import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(file)) throw new Error('MainActivity.java not found');
let source = fs.readFileSync(file, 'utf8');

source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V5', 'VIDGRAB_ANDROID_SAFE_AREA_V9');
source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V8', 'VIDGRAB_ANDROID_SAFE_AREA_V9');
source = source.replace('VIDGRAB_ANDROID_SAFE_AREA_V7', 'VIDGRAB_ANDROID_SAFE_AREA_V9');
source = source.replace('getWindow().setDecorFitsSystemWindows(true);', 'getWindow().setDecorFitsSystemWindows(false);');

// Android 15 enforces edge-to-edge. Do not pad the WebView itself because its
// background can still paint behind the status bar. Instead, inset the native
// container that owns the WebView so the entire HTML app starts below the
// status bar/display cutout and ends above the navigation bar.
source = source.replace('        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().setPadding(0, 0, 0, 0);', `        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setPadding(0, 0, 0, 0);

            // VIDGRAB_ANDROID_SYSTEM_BARS_V9
            getWindow().setStatusBarColor(Color.rgb(248, 250, 252));
            getWindow().setNavigationBarColor(Color.rgb(248, 250, 252));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                getWindow().getDecorView().setSystemUiVisibility(flags);
            }

            final android.view.View webView = bridge.getWebView();
            final android.view.ViewParent parent = webView.getParent();
            if (parent instanceof android.view.ViewGroup) {
                final android.view.ViewGroup container = (android.view.ViewGroup) parent;
                container.setBackgroundColor(Color.rgb(248, 250, 252));
                container.setOnApplyWindowInsetsListener((view, insets) -> {
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
                container.requestApplyInsets();
            }`);

// Remove any older WebView-level inset block if a generated template ever
// contains one. The native parent container above is the single source of truth.
source = source.replace(/\n\s*\/\/ VIDGRAB_ANDROID_INSETS_V8:[\s\S]*?bridge\.getWebView\(\)\.requestApplyInsets\(\);/, '');
source = source.replace(/\n\s*\/\/ VIDGRAB_ANDROID_INSETS_V9:[\s\S]*?bridge\.getWebView\(\)\.requestApplyInsets\(\);/, '');

if (!source.includes('getClipboardText()')) {
  const anchor = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const method = `    @JavascriptInterface
    public String getClipboardText() {
        try {
            android.content.ClipboardManager cm = (android.content.ClipboardManager) activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            if (cm == null || !cm.hasPrimaryClip()) return "";
            android.content.ClipData clip = cm.getPrimaryClip();
            if (clip == null || clip.getItemCount() == 0) return "";
            CharSequence text = clip.getItemAt(0).coerceToText(activity);
            return text == null ? "" : text.toString();
        } catch (Exception e) { return ""; }
    }

`;
  source = source.replace(anchor, method + anchor);
}

fs.writeFileSync(file, source);
console.log('[native] VidGrab Android V9: native container is inset below status/cutout and above navigation bar');
