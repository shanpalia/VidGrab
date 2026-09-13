import fs from 'node:fs';
import path from 'node:path';

const androidRoot = path.join(process.cwd(), 'android');
const javaDir = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
const mainFile = path.join(javaDir, 'MainActivity.java');
const browserFile = path.join(javaDir, 'VidGrabBrowserActivity.java');
if (!fs.existsSync(mainFile)) throw new Error('MainActivity.java not found');
fs.mkdirSync(javaDir, { recursive: true });

let source = fs.readFileSync(mainFile, 'utf8');

// Remove the older package-private browser class if a previously generated
// Android tree is ever reused. android:exported=false activities must still
// be publicly instantiable by the Android framework.
const marker = '// VIDGRAB_NATIVE_BROWSER_V1';
const markerIndex = source.indexOf(marker);
if (markerIndex >= 0) source = source.slice(0, markerIndex).trimEnd() + '\n';

if (!source.includes('VIDGRAB_NATIVE_BROWSER_V2')) {
  source = source.replace(
    'import android.webkit.JavascriptInterface;\n',
    'import android.webkit.JavascriptInterface;\n'
  );

  const classNeedle = 'public class MainActivity extends BridgeActivity {\n';
  const classReplacement = `public class MainActivity extends BridgeActivity {\n    private static MainActivity currentInstance;\n    static MainActivity getCurrentInstance() { return currentInstance; }\n    void notifyBrowserClosed() {\n        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(\"window.dispatchEvent(new Event('vidgrab-native-browser-closed'));\", null));\n        }\n    }\n`;
  source = source.replace(classNeedle, classReplacement);
  source = source.replace('super.onCreate(savedInstanceState);\n', 'super.onCreate(savedInstanceState);\n        currentInstance = this;\n', 1);

  const bridgeNeedle = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const bridgeMethod = `    @JavascriptInterface\n    public boolean openBrowser(String url) {\n        try {\n            Intent intent = new Intent(activity, VidGrabBrowserActivity.class);\n            intent.putExtra(\"url\", url == null || url.trim().isEmpty() ? \"https://www.youtube.com/\" : url.trim());\n            activity.startActivity(intent);\n            return true;\n        } catch (Exception e) { return false; }\n    }\n\n`;
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
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

// VIDGRAB_NATIVE_BROWSER_V2
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
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }

        String initial = getIntent().getStringExtra("url");
        if (initial == null || initial.trim().isEmpty()) initial = "https://www.youtube.com/";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        root.setFitsSystemWindows(true);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(6), dp(6), dp(6), dp(6));
        toolbar.setBackgroundColor(Color.WHITE);
        toolbar.setElevation(dp(2));

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
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);

        back.setOnClickListener(v -> { if (webView.canGoBack()) webView.goBack(); else finish(); });
        forward.setOnClickListener(v -> { if (webView.canGoForward()) webView.goForward(); });
        reload.setOnClickListener(v -> webView.reload());
        go.setOnClickListener(v -> loadAddress());
        address.setOnEditorActionListener((v, actionId, event) -> { loadAddress(); return true; });
        close.setOnClickListener(v -> finish());
        webView.loadUrl(initial);
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
        if (value.matches("(?i)^https?://.*")) {
            webView.loadUrl(value);
        } else if (value.matches("^\\\\S+\\\\.\\\\S+.*$")) {
            webView.loadUrl("https://" + value);
        } else {
            webView.loadUrl("https://www.youtube.com/results?search_query=" + Uri.encode(value));
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
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

console.log('[native-browser] public Android WebView browser activity generated');
