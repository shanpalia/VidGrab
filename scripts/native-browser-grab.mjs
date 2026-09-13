import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
const mainFile = path.join(dir, 'MainActivity.java');
const browserFile = path.join(dir, 'VidGrabBrowserActivity.java');
if (!fs.existsSync(mainFile) || !fs.existsSync(browserFile)) throw new Error('Native browser files not found');

let main = fs.readFileSync(mainFile, 'utf8');

if (!main.includes('static MainActivity getCurrentInstance()')) {
  throw new Error('Generated MainActivity browser bridge not found');
}

if (!main.includes('VIDGRAB_NATIVE_GRAB_V1')) {
  const closeStart = main.indexOf('void notifyBrowserClosed()');
  if (closeStart < 0) throw new Error('notifyBrowserClosed method not found');
  const open = main.indexOf('{', closeStart);
  if (open < 0) throw new Error('notifyBrowserClosed opening brace not found');

  let depth = 0, end = -1, inString = false, escaped = false;
  for (let i = open; i < main.length; i++) {
    const c = main[i];
    if (inString) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') inString = false; continue; }
    if (c === '"') { inString = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error('notifyBrowserClosed block has invalid braces');

  const replacement = `void notifyBrowserClosed() {
        if (browserGrabHandoff) return;
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('vidgrab-native-browser-closed'));", null));
        }
    }
    void notifyBrowserGrab(String url) {
        browserGrabHandoff = true;
        if (bridge != null && bridge.getWebView() != null) {
            final String safe = org.json.JSONObject.quote(url == null ? "" : url);
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('vidgrab-native-grab',{detail:{url:"+safe+"}}));", null));
        }
    }
    void notifyBrowserNavigate(String tab) {
        if (bridge != null && bridge.getWebView() != null) {
            final String safe = org.json.JSONObject.quote(tab == null ? "home" : tab);
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('vidgrab-native-navigate',{detail:{tab:"+safe+"}}));", null));
        }
    }`;

  main = main.slice(0, closeStart) + 'private boolean browserGrabHandoff = false;\n    ' + replacement + main.slice(end);
  main = main.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {\n    // VIDGRAB_NATIVE_GRAB_V1');
  fs.writeFileSync(mainFile, main);
}

let browser = fs.readFileSync(browserFile, 'utf8');
if (!browser.includes('VIDGRAB_NATIVE_GRAB_V1')) {
  browser = browser.replace('import android.webkit.WebChromeClient;', 'import android.webkit.JavascriptInterface;\nimport android.webkit.WebChromeClient;');
  browser = browser.replace('public class VidGrabBrowserActivity extends Activity {', 'public class VidGrabBrowserActivity extends Activity {\n    // VIDGRAB_NATIVE_GRAB_V1\n    private boolean autoGrabTriggered = false;');

  const toolbarNeedle = '        TextView close = textButton("✕");';
  if (!browser.includes(toolbarNeedle)) throw new Error('Browser toolbar close control not found');
  browser = browser.replace(
    toolbarNeedle,
    '        TextView grab = textButton("GRAB");\n        grab.setTextColor(Color.rgb(220, 25, 35));\n\n        TextView close = textButton("✕");'
  );

  const addNeedle = '        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));';
  if (!browser.includes(addNeedle)) throw new Error('Browser toolbar layout not found');
  browser = browser.replace(
    addNeedle,
    '        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(grab, new LinearLayout.LayoutParams(dp(58), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));'
  );

  const clickNeedle = '        close.setOnClickListener(v -> finish());\n        webView.loadUrl(initial);';
  if (!browser.includes(clickNeedle)) throw new Error('Browser click handlers not found');
  browser = browser.replace(
    clickNeedle,
    '        close.setOnClickListener(v -> finish());\n        grab.setOnClickListener(v -> {\n            MainActivity main=MainActivity.getCurrentInstance();\n            if(main!=null){ main.notifyBrowserGrab(webView.getUrl()); finish(); }\n        });\n        webView.loadUrl(initial);'
  );

  browser = browser.replace('        webView.setBackgroundColor(Color.WHITE);', '        webView.setBackgroundColor(Color.WHITE);\n        webView.addJavascriptInterface(new BrowserMediaBridge(), "VidGrabMedia");');

  browser = browser.replace('                syncToolbar();\n', '                syncToolbar();\n                installMediaGrabHook();\n', 1);

  const bridgeClass = `\n    private class BrowserMediaBridge {\n        @JavascriptInterface public void onVideoPlay() {\n            if (autoGrabTriggered) return;\n            autoGrabTriggered = true;\n            runOnUiThread(() -> {\n                MainActivity main = MainActivity.getCurrentInstance();\n                if (main != null) { main.notifyBrowserGrab(webView == null ? "" : webView.getUrl()); finish(); }\n            });\n        }\n    }\n`;
  browser = browser.replace('    @Override public void onCreate(Bundle savedInstanceState) {', bridgeClass + '\n    @Override public void onCreate(Bundle savedInstanceState) {');

  const hook = `\n    private void installMediaGrabHook() {\n        String script = "(function(){try{function h(v){if(v.dataset.vgGrab)return;v.dataset.vgGrab='1';v.addEventListener('play',function(){if(window.VidGrabMedia)window.VidGrabMedia.onVideoPlay();},{once:true});}document.querySelectorAll('video').forEach(h);new MutationObserver(function(){document.querySelectorAll('video').forEach(h)}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})()";\n        try { webView.evaluateJavascript(script, null); } catch (Exception ignored) {}\n    }\n`;
  browser = browser.replace('    private void syncToolbar() {', hook + '\n    private void syncToolbar() {');

  const navNeedle = '        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));\n        setContentView(root);';
  if (!browser.includes(navNeedle)) throw new Error('Browser WebView insertion point not found');
  const nav = `        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));\n\n        // VIDGRAB_NATIVE_BOTTOM_NAV_V1\n        LinearLayout bottomNav = new LinearLayout(this);\n        bottomNav.setGravity(Gravity.CENTER);\n        bottomNav.setPadding(dp(4), dp(3), dp(4), dp(3));\n        bottomNav.setBackgroundColor(Color.WHITE);\n        bottomNav.setElevation(dp(6));\n        String[] tabs = {"⌂\\nHome", "♫\\nMusic", "▣\\nVideo", "⇩\\nMy Files", "♙\\nMe"};\n        String[] ids = {"home", "music", "video", "files", "me"};\n        for (int i = 0; i < tabs.length; i++) {\n            final String tab = ids[i];\n            TextView item = textButton(tabs[i]);\n            item.setTextSize(11);\n            item.setTextColor(i == 0 ? Color.rgb(220,25,35) : Color.rgb(90,100,115));\n            item.setGravity(Gravity.CENTER);\n            item.setOnClickListener(v -> {\n                MainActivity main = MainActivity.getCurrentInstance();\n                if (main != null) main.notifyBrowserNavigate(tab);\n                finish();\n            });\n            bottomNav.addView(item, new LinearLayout.LayoutParams(0, dp(60), 1f));\n        }\n        root.addView(bottomNav, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(68)));\n        setContentView(root);`;
  browser = browser.replace(navNeedle, nav);

  const hide = `\n    private void hideVidGrabSystemNavigation() {\n        try {\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                android.view.WindowInsetsController controller = getWindow().getInsetsController();\n                if (controller != null) {\n                    controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);\n                    controller.hide(android.view.WindowInsets.Type.navigationBars());\n                }\n            } else {\n                getWindow().getDecorView().setSystemUiVisibility(\n                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |\n                    android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |\n                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR\n                );\n            }\n        } catch (Exception ignored) {}\n    }\n`;
  browser = browser.slice(0, browser.lastIndexOf('\n}')) + hide + `\n    @Override public void onWindowFocusChanged(boolean hasFocus) {\n        super.onWindowFocusChanged(hasFocus);\n        if (hasFocus) hideVidGrabSystemNavigation();\n    }\n` + '\n}\n';
  browser = browser.replace('super.onCreate(savedInstanceState);', 'super.onCreate(savedInstanceState);\n        hideVidGrabSystemNavigation();', 1);

  fs.writeFileSync(browserFile, browser);
}

console.log('[native-browser-grab] browser GRAB handoff + auto video GRAB + persistent native bottom navigation generated');
