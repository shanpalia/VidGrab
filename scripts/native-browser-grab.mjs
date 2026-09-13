import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
const mainFile = path.join(dir, 'MainActivity.java');
const browserFile = path.join(dir, 'VidGrabBrowserActivity.java');
if (!fs.existsSync(mainFile) || !fs.existsSync(browserFile)) throw new Error('Native browser files not found');

let main = fs.readFileSync(mainFile, 'utf8');
if (!main.includes('static MainActivity getCurrentInstance()')) throw new Error('Generated MainActivity browser bridge not found');

if (!main.includes('VIDGRAB_NATIVE_GRAB_V2')) {
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
        if (browserGrabHandoff) { browserGrabHandoff = false; return; }
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
        browserGrabHandoff = true;
        if (bridge != null && bridge.getWebView() != null) {
            final String safe = org.json.JSONObject.quote(tab == null ? "home" : tab);
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('vidgrab-native-navigate',{detail:{tab:"+safe+"}}));", null));
        }
    }`;
  main = main.slice(0, closeStart) + 'private boolean browserGrabHandoff = false;\n    ' + replacement + main.slice(end);
  main = main.replace('public class MainActivity extends BridgeActivity {', 'public class MainActivity extends BridgeActivity {\n    // VIDGRAB_NATIVE_GRAB_V2');
  fs.writeFileSync(mainFile, main);
}

let browser = fs.readFileSync(browserFile, 'utf8');
if (!browser.includes('VIDGRAB_NATIVE_GRAB_V3')) {
  browser = browser.replace('public class VidGrabBrowserActivity extends Activity {', `public class VidGrabBrowserActivity extends Activity {
    // VIDGRAB_NATIVE_GRAB_V3
    private boolean autoGrabTriggered = false;
    private android.app.Dialog grabDialog;`);

  const toolbarNeedle = '        TextView close = textButton("✕");';
  if (!browser.includes(toolbarNeedle)) throw new Error('Browser toolbar close control not found');
  browser = browser.replace(toolbarNeedle, `        TextView grab = textButton("GRAB");
        grab.setTextColor(Color.rgb(220, 25, 35));

        TextView close = textButton("✕");`);

  const addNeedle = '        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));';
  if (!browser.includes(addNeedle)) throw new Error('Browser toolbar layout not found');
  browser = browser.replace(addNeedle, `        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));
        toolbar.addView(grab, new LinearLayout.LayoutParams(dp(58), dp(46)));
        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));`);

  const clickNeedle = '        close.setOnClickListener(v -> finish());\n        webView.loadUrl(initial);';
  if (!browser.includes(clickNeedle)) throw new Error('Browser click handlers not found');
  browser = browser.replace(clickNeedle, `        close.setOnClickListener(v -> finish());
        grab.setOnClickListener(v -> {
            String current = webView == null ? "" : webView.getUrl();
            if (isVideoPageUrl(current)) showGrabDialog(current);
            else android.widget.Toast.makeText(this, "Open a video first", android.widget.Toast.LENGTH_SHORT).show();
        });
        webView.loadUrl(initial);`);

  browser = browser.replace('        webView.setBackgroundColor(Color.WHITE);', '        webView.setBackgroundColor(Color.WHITE);\n        webView.addJavascriptInterface(new BrowserMediaBridge(), "VidGrabMedia");');
  browser = browser.replace('                syncToolbar();\n', '                syncToolbar();\n                autoGrabTriggered = false;\n                installMediaGrabHook();\n', 1);

  const bridgeClass = `
    private class BrowserMediaBridge {
        @android.webkit.JavascriptInterface public void onVideoPlay() {
            if (autoGrabTriggered) return;
            String current = webView == null ? "" : webView.getUrl();
            if (!isVideoPageUrl(current)) return;
            autoGrabTriggered = true;
            runOnUiThread(() -> showGrabDialog(webView == null ? "" : webView.getUrl()));
        }
    }
`;
  browser = browser.replace('    @Override public void onCreate(Bundle savedInstanceState) {', bridgeClass + '\n    @Override public void onCreate(Bundle savedInstanceState) {');

  const hook = `
    private boolean isVideoPageUrl(String url) {
        if (url == null) return false;
        String u = url.toLowerCase(java.util.Locale.US);
        return u.matches("https?://(www\\\\.|m\\\\.)?(youtube\\\\.com/watch\\\\?[^ ]*v=[^& ]+.*|youtube\\\\.com/shorts/[^/?#]+.*|youtube\\\\.com/embed/[^/?#]+.*|youtu\\\\.be/[^/?#]+.*)")
            || u.matches("https?://(www\\\\.)?instagram\\\\.com/(reel|p|tv)/[^/?#]+.*")
            || u.matches("https?://(www\\\\.)?tiktok\\\\.com/.*?/video/[^/?#]+.*")
            || u.matches("https?://(www\\\\.)?(facebook\\\\.com/watch|fb\\\\.watch/).*" )
            || u.matches("https?://(www\\\\.)?(twitter\\\\.com|x\\\\.com)/[^/]+/status/[^/?#]+.*");
    }

    private void installMediaGrabHook() {
        String script = "(function(){try{function h(v){if(v.dataset.vgGrab)return;v.dataset.vgGrab='1';v.addEventListener('play',function(){if(window.VidGrabMedia)window.VidGrabMedia.onVideoPlay();},{once:true});}document.querySelectorAll('video').forEach(h);if(document.documentElement)new MutationObserver(function(){document.querySelectorAll('video').forEach(h)}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})()";
        try { webView.evaluateJavascript(script, null); } catch (Exception ignored) {}
    }

    private void showGrabDialog(String url) {
        if (!isVideoPageUrl(url) || isFinishing() || (grabDialog != null && grabDialog.isShowing())) return;
        android.app.Dialog dialog = new android.app.Dialog(this);
        grabDialog = dialog;
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(22), dp(20), dp(22), dp(14));
        box.setBackgroundColor(Color.WHITE);

        TextView title = textButton("GRAB THIS VIDEO?");
        title.setTextSize(19);
        title.setTextColor(Color.rgb(25,35,50));
        title.setGravity(Gravity.LEFT);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        box.addView(title, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(38)));

        TextView sub = textButton("Video detected • ready to download");
        sub.setTextSize(13);
        sub.setTextColor(Color.rgb(100,110,125));
        sub.setGravity(Gravity.LEFT);
        box.addView(sub, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(34)));

        TextView urlView = textButton(url == null ? "" : url);
        urlView.setTextSize(11);
        urlView.setTextColor(Color.rgb(120,125,135));
        urlView.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
        urlView.setMaxLines(2);
        box.addView(urlView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)));

        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        TextView later = textButton("LATER");
        later.setTextColor(Color.rgb(95,100,110));
        TextView grabNow = textButton("GRAB");
        grabNow.setTextColor(Color.rgb(220,25,35));
        grabNow.setTypeface(null, android.graphics.Typeface.BOLD);
        actions.addView(later, new LinearLayout.LayoutParams(dp(86), dp(50)));
        actions.addView(grabNow, new LinearLayout.LayoutParams(dp(86), dp(50)));
        box.addView(actions, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56)));

        dialog.setContentView(box);
        android.view.Window window = dialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
            window.setDimAmount(0.55f);
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            window.setGravity(Gravity.BOTTOM);
        }
        later.setOnClickListener(v -> dialog.dismiss());
        grabNow.setOnClickListener(v -> {
            dialog.dismiss();
            MainActivity main = MainActivity.getCurrentInstance();
            if (main != null) {
                main.notifyBrowserGrab(webView == null ? "" : webView.getUrl());
                finish();
            }
        });
        dialog.setOnDismissListener(d -> grabDialog = null);
        dialog.show();
        if (window != null) {
            window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.WHITE));
            window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            window.setGravity(Gravity.BOTTOM);
        }
    }
`;
  browser = browser.replace('    private void syncToolbar() {', hook + '\n    private void syncToolbar() {');

  const navNeedle = '        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));\n        setContentView(root);';
  if (!browser.includes(navNeedle)) throw new Error('Browser WebView insertion point not found');
  const nav = `        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        // VIDGRAB_NATIVE_BOTTOM_NAV_V2
        LinearLayout bottomNav = new LinearLayout(this);
        bottomNav.setGravity(Gravity.CENTER);
        bottomNav.setPadding(dp(4), dp(3), dp(4), dp(3));
        bottomNav.setBackgroundColor(Color.WHITE);
        bottomNav.setElevation(dp(6));
        String[] tabs = {"⌂\\nHome", "♫\\nMusic", "▣\\nVideo", "⇩\\nMy Files", "♙\\nMe"};
        String[] ids = {"home", "music", "video", "files", "me"};
        for (int i = 0; i < tabs.length; i++) {
            final String tab = ids[i];
            TextView item = textButton(tabs[i]);
            item.setTextSize(11);
            item.setTextColor(i == 0 ? Color.rgb(220,25,35) : Color.rgb(90,100,115));
            item.setGravity(Gravity.CENTER);
            item.setOnClickListener(v -> {
                MainActivity main = MainActivity.getCurrentInstance();
                if (main != null) main.notifyBrowserNavigate(tab);
                finish();
            });
            bottomNav.addView(item, new LinearLayout.LayoutParams(0, dp(60), 1f));
        }
        LinearLayout.LayoutParams navLp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(68));
        navLp.setMargins(dp(8), 0, dp(8), dp(10));
        root.addView(bottomNav, navLp);
        setContentView(root);`;
  browser = browser.replace(navNeedle, nav);

  const hide = `
    private void hideVidGrabSystemNavigation() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.view.WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    controller.hide(android.view.WindowInsets.Type.navigationBars());
                }
            } else {
                android.view.View decor = getWindow().getDecorView();
                decor.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE | android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        } catch (Exception ignored) {}
    }
`;
  browser = browser.slice(0, browser.lastIndexOf('\n}')) + hide + `
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideVidGrabSystemNavigation();
    }
` + '\n}\n';
  browser = browser.replace('super.onCreate(savedInstanceState);', 'super.onCreate(savedInstanceState);\n        hideVidGrabSystemNavigation();', 1);

  fs.writeFileSync(browserFile, browser);
}

console.log('[native-browser-grab] selected-video-only GRAB flow generated; search-result previews no longer trigger download popup');
