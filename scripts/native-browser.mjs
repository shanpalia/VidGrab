import fs from 'node:fs';
import path from 'node:path';

const androidRoot = path.join(process.cwd(), 'android');
const javaDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
const mainFile = path.join(javaDir, 'MainActivity.java');
const browserFile = path.join(javaDir, 'VidGrabBrowserActivity.java');
if (!fs.existsSync(mainFile)) throw new Error('MainActivity.java not found');
fs.mkdirSync(javaDir, { recursive: true });

let source = fs.readFileSync(mainFile, 'utf8');
const marker = '// VIDGRAB_NATIVE_BROWSER_V1';
const markerIndex = source.indexOf(marker);
if (markerIndex >= 0) source = source.slice(0, markerIndex).trimEnd() + '\n';

if (!source.includes('VIDGRAB_NATIVE_BROWSER_V2')) {
  const classNeedle = 'public class MainActivity extends BridgeActivity {\n';
  const classReplacement = `public class MainActivity extends BridgeActivity {
    private static MainActivity currentInstance;
    static MainActivity getCurrentInstance() { return currentInstance; }
    void notifyBrowserClosed() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('vidgrab-native-browser-closed'));", null));
        }
    }
`;
  source = source.replace(classNeedle, classReplacement);
  source = source.replace('super.onCreate(savedInstanceState);\n', 'super.onCreate(savedInstanceState);\n        currentInstance = this;\n', 1);
  const bridgeNeedle = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const bridgeMethod = `    @JavascriptInterface
    public boolean openBrowser(String url) {
        try {
            Intent intent = new Intent(activity, VidGrabBrowserActivity.class);
            intent.putExtra("url", url == null || url.trim().isEmpty() ? "https://www.youtube.com/" : url.trim());
            activity.startActivity(intent);
            return true;
        } catch (Exception e) { return false; }
    }

`;
  source = source.replace(bridgeNeedle, bridgeMethod + bridgeNeedle);
}
source = source.replace('VIDGRAB_NATIVE_BROWSER_V1', 'VIDGRAB_NATIVE_BROWSER_V2');
fs.writeFileSync(mainFile, source);

const browserSource = `package com.shanpalia.vidgrab;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

// VIDGRAB_NATIVE_BROWSER_V3
public class VidGrabBrowserActivity extends Activity {
    private WebView webView;
    private EditText address;
    private ImageButton back;
    private ImageButton forward;
    private ImageButton reload;

    private int dp(float value) { return (int) (value * getResources().getDisplayMetrics().density + 0.5f); }

    private TextView textButton(String label) {
        TextView v = new TextView(this);
        v.setText(label);
        v.setTextSize(13);
        v.setTextColor(Color.DKGRAY);
        v.setGravity(Gravity.CENTER);
        v.setPadding(dp(8), 0, dp(8), 0);
        v.setClickable(true);
        return v;
    }

    private GradientDrawable rounded(int color) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(24));
        return d;
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureVidGrabWindow();

        String initial = getIntent().getStringExtra("url");
        if (initial == null || initial.trim().isEmpty()) initial = "https://www.youtube.com/";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        root.setFitsSystemWindows(false);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(6), dp(6), dp(6), dp(6));
        toolbar.setBackgroundColor(Color.WHITE);
        toolbar.setElevation(dp(2));
        toolbar.setTag("VIDGRAB_BROWSER_TOOLBAR_SAFE_AREA_V3");
        toolbar.setOnApplyWindowInsetsListener((v, insets) -> {
            int top = insets.getInsets(WindowInsets.Type.statusBars()).top;
            int left = insets.getInsets(WindowInsets.Type.displayCutout()).left;
            int right = insets.getInsets(WindowInsets.Type.displayCutout()).right;
            v.setPadding(Math.max(dp(6), left + dp(6)), top + dp(6), Math.max(dp(6), right + dp(6)), dp(6));
            v.getLayoutParams().height = dp(58) + top;
            v.requestLayout();
            return insets;
        });

        back = new ImageButton(this);
        back.setImageResource(android.R.drawable.ic_media_previous);
        back.setBackgroundColor(Color.TRANSPARENT);
        forward = new ImageButton(this);
        forward.setImageResource(android.R.drawable.ic_media_next);
        forward.setBackgroundColor(Color.TRANSPARENT);
        reload = new ImageButton(this);
        reload.setImageResource(android.R.drawable.ic_popup_sync);
        reload.setBackgroundColor(Color.TRANSPARENT);

        address = new EditText(this);
        address.setSingleLine(true);
        address.setTextSize(14);
        address.setTextColor(Color.rgb(25, 35, 50));
        address.setHint("Search or enter URL");
        address.setPadding(dp(14), 0, dp(14), 0);
        address.setBackground(rounded(Color.rgb(245, 246, 248)));
        LinearLayout.LayoutParams addressLp = new LinearLayout.LayoutParams(0, dp(46), 1f);
        addressLp.setMargins(dp(4), 0, dp(4), 0);

        TextView go = textButton("GO");
        go.setTextColor(Color.rgb(220, 25, 35));
        TextView close = textButton("✕");
        close.setTextSize(18);

        toolbar.addView(back, new LinearLayout.LayoutParams(dp(42), dp(46)));
        toolbar.addView(forward, new LinearLayout.LayoutParams(dp(42), dp(46)));
        toolbar.addView(reload, new LinearLayout.LayoutParams(dp(42), dp(46)));
        toolbar.addView(address, addressLp);
        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));
        // GRAB is added by native-browser-grab.mjs.
        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));
        root.addView(toolbar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(58)));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setLoadsImagesAutomatically(true);
        webView.getSettings().setSupportZoom(true);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDisplayZoomControls(false);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setNestedScrollingEnabled(true);
        webView.setVerticalScrollBarEnabled(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                syncToolbar();
                hideDuplicateSiteNavigation();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return false; }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return false; }
        });
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        root.post(this::configureVidGrabWindow);
        toolbar.requestApplyInsets();

        back.setOnClickListener(v -> { if (webView.canGoBack()) webView.goBack(); else finish(); });
        forward.setOnClickListener(v -> { if (webView.canGoForward()) webView.goForward(); });
        reload.setOnClickListener(v -> webView.reload());
        go.setOnClickListener(v -> loadAddress());
        address.setOnEditorActionListener((v, actionId, event) -> { loadAddress(); return true; });
        close.setOnClickListener(v -> finish());
        webView.loadUrl(initial);
    }

    private void configureVidGrabWindow() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                getWindow().setDecorFitsSystemWindows(false);
            }
            getWindow().setStatusBarColor(Color.WHITE);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) getWindow().setNavigationBarContrastEnforced(false);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            hideVidGrabSystemNavigation();
        } catch (Exception ignored) {}
    }

    private void hideDuplicateSiteNavigation() {
        String css = "ytm-pivot-bar-renderer,ytm-pivot-bar-item-renderer{display:none!important}";
        String script = "(function(){try{var id='vidgrab-hide-site-nav';var s=document.getElementById(id);if(!s){s=document.createElement('style');s.id=id;s.textContent='" + css + "';document.head.appendChild(s);}document.querySelectorAll('ytm-pivot-bar-renderer,ytm-pivot-bar-item-renderer').forEach(function(e){e.style.display='none'});}catch(e){}})()";
        try { webView.evaluateJavascript(script, null); } catch (Exception ignored) {}
    }

    private void hideVidGrabSystemNavigation() {
        try {
            View decor = getWindow().getDecorView();
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            decor.setSystemUiVisibility(flags);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.view.WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    controller.hide(android.view.WindowInsets.Type.navigationBars());
                }
            }
        } catch (Exception ignored) {}
    }

    @Override public void onResume() {
        super.onResume();
        configureVidGrabWindow();
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideVidGrabSystemNavigation();
    }

    private void syncToolbar() {
        runOnUiThread(() -> {
            if (webView == null) return;
            back.setEnabled(webView.canGoBack());
            forward.setEnabled(webView.canGoForward());
            String u = webView.getUrl();
            if (u != null && !u.isEmpty()) address.setText(u);
        });
    }

    private void loadAddress() {
        String value = address.getText().toString().trim();
        if (value.isEmpty()) return;
        if (value.matches("(?i)^https?://.*")) webView.loadUrl(value);
        else if (value.matches("^\\\\S+\\\\.\\\\S+.*$")) webView.loadUrl("https://" + value);
        else webView.loadUrl("https://www.youtube.com/results?search_query=" + Uri.encode(value));
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) { webView.goBack(); return; }
        finish();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        MainActivity main = MainActivity.getCurrentInstance();
        if (main != null) main.notifyBrowserClosed();
        super.onDestroy();
    }
}
`;
fs.writeFileSync(browserFile, browserSource);

const manifest = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let text = fs.readFileSync(manifest, 'utf8');
  text = text.replace(/\s*<activity android:name="\.VidGrabBrowserActivity"[^>]*\/>/g, '');
  if (!text.includes('android:name=".VidGrabBrowserActivity"')) {
    text = text.replace('</application>', '        <activity android:name=".VidGrabBrowserActivity" android:exported="false" android:screenOrientation="unspecified" />\n    </application>');
  }
  fs.writeFileSync(manifest, text);
}

console.log('[native-browser] V4 browser generated: safe toolbar, persistent immersive navigation hiding, and YouTube bottom-nav-only suppression');
