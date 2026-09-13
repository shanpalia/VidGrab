import fs from 'node:fs';
import path from 'node:path';

const androidRoot = path.join(process.cwd(), 'android');
const file = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
let source = fs.readFileSync(file, 'utf8');

if (!source.includes('VIDGRAB_NATIVE_BROWSER_V1')) {
  source = source.replace('import android.webkit.JavascriptInterface;\n', 'import android.webkit.JavascriptInterface;\nimport android.webkit.WebChromeClient;\nimport android.webkit.WebView;\nimport android.webkit.WebViewClient;\nimport android.graphics.drawable.GradientDrawable;\nimport android.view.Gravity;\nimport android.view.View;\nimport android.view.ViewGroup;\nimport android.widget.EditText;\nimport android.widget.ImageButton;\nimport android.widget.LinearLayout;\nimport android.widget.TextView;\n');
  source = source.replace('public class MainActivity extends BridgeActivity {\n', 'public class MainActivity extends BridgeActivity {\n    private static MainActivity currentInstance;\n    static MainActivity getCurrentInstance() { return currentInstance; }\n    void notifyBrowserClosed() {\n        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event(\\\'vidgrab-native-browser-closed\\\'));", null));\n        }\n    }\n');
  source = source.replace('super.onCreate(savedInstanceState);\n', 'super.onCreate(savedInstanceState);\n        currentInstance = this;\n', 1);
  const bridgeNeedle = '    @JavascriptInterface\n    public String getDownloadRoot()';
  const bridgeMethod = '    @JavascriptInterface\n    public boolean openBrowser(String url) {\n        try {\n            Intent intent = new Intent(activity, VidGrabBrowserActivity.class);\n            intent.putExtra("url", url == null || url.trim().isEmpty() ? "https://www.youtube.com/" : url.trim());\n            activity.startActivity(intent);\n            return true;\n        } catch (Exception e) { return false; }\n    }\n\n';
  source = source.replace(bridgeNeedle, bridgeMethod + bridgeNeedle);
  source += `

// VIDGRAB_NATIVE_BROWSER_V1
class VidGrabBrowserActivity extends android.app.Activity {
    private WebView webView;
    private EditText address;
    private ImageButton back;
    private ImageButton forward;
    private ImageButton reload;

    private int dp(float value) { return (int) (value * getResources().getDisplayMetrics().density + 0.5f); }
    private TextView textButton(String label) {
        TextView v = new TextView(this); v.setText(label); v.setTextSize(13); v.setTextColor(android.graphics.Color.DKGRAY);
        v.setGravity(Gravity.CENTER); v.setPadding(dp(8), 0, dp(8), 0); return v;
    }
    private GradientDrawable rounded(int color) {
        GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(24)); return d;
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.WHITE);
        getWindow().setNavigationBarColor(android.graphics.Color.WHITE);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
        String initial = getIntent().getStringExtra("url");
        if (initial == null || initial.trim().isEmpty()) initial = "https://www.youtube.com/";

        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(android.graphics.Color.WHITE);
        LinearLayout toolbar = new LinearLayout(this); toolbar.setGravity(Gravity.CENTER_VERTICAL); toolbar.setPadding(dp(6), dp(6), dp(6), dp(6)); toolbar.setBackgroundColor(android.graphics.Color.WHITE); toolbar.setElevation(dp(2));
        back = new ImageButton(this); back.setImageResource(android.R.drawable.ic_media_previous); back.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        forward = new ImageButton(this); forward.setImageResource(android.R.drawable.ic_media_next); forward.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        reload = new ImageButton(this); reload.setImageResource(android.R.drawable.ic_popup_sync); reload.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        address = new EditText(this); address.setSingleLine(true); address.setTextSize(14); address.setTextColor(android.graphics.Color.rgb(25,35,50)); address.setHint("Search or enter URL"); address.setPadding(dp(14),0,dp(14),0); address.setBackground(rounded(android.graphics.Color.rgb(245,246,248)));
        LinearLayout.LayoutParams addressLp = new LinearLayout.LayoutParams(0, dp(46), 1f); addressLp.setMargins(dp(4),0,dp(4),0);
        TextView go = textButton("GO"); go.setTextColor(android.graphics.Color.rgb(220,25,35)); TextView close = textButton("✕"); close.setTextSize(18);
        toolbar.addView(back, new LinearLayout.LayoutParams(dp(42),dp(46))); toolbar.addView(forward,new LinearLayout.LayoutParams(dp(42),dp(46))); toolbar.addView(reload,new LinearLayout.LayoutParams(dp(42),dp(46))); toolbar.addView(address,addressLp); toolbar.addView(go,new LinearLayout.LayoutParams(dp(44),dp(46))); toolbar.addView(close,new LinearLayout.LayoutParams(dp(42),dp(46)));
        root.addView(toolbar,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,dp(58)));

        webView = new WebView(this); webView.setBackgroundColor(android.graphics.Color.WHITE); webView.getSettings().setJavaScriptEnabled(true); webView.getSettings().setDomStorageEnabled(true); webView.getSettings().setDatabaseEnabled(true); webView.getSettings().setLoadsImagesAutomatically(true); webView.getSettings().setSupportZoom(true); webView.getSettings().setBuiltInZoomControls(false); webView.getSettings().setDisplayZoomControls(false); webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS); webView.setNestedScrollingEnabled(true); webView.setWebChromeClient(new WebChromeClient());
        root.addView(webView,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1f)); setContentView(root);

        Runnable sync = () -> { back.setEnabled(webView.canGoBack()); forward.setEnabled(webView.canGoForward()); String u=webView.getUrl(); if(u!=null) address.setText(u); };
        back.setOnClickListener(v->{ if(webView.canGoBack()) webView.goBack(); else finish(); }); forward.setOnClickListener(v->{ if(webView.canGoForward()) webView.goForward(); }); reload.setOnClickListener(v->webView.reload()); go.setOnClickListener(v->loadAddress()); address.setOnEditorActionListener((v,actionId,event)->{loadAddress();return true;}); close.setOnClickListener(v->finish());
        webView.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){ super.onPageFinished(view,url); runOnUiThread(sync); }
            @Override public boolean shouldOverrideUrlLoading(WebView view,android.webkit.WebResourceRequest request){ return false; }
        });
        webView.loadUrl(initial);
    }

    private void loadAddress() {
        String value=address.getText().toString().trim(); if(value.isEmpty()) return;
        if(value.matches("(?i)^https?://.*")) webView.loadUrl(value);
        else if(value.matches("^\\S+\\.\\S+.*$")) webView.loadUrl("https://"+value);
        else webView.loadUrl("https://www.youtube.com/results?search_query="+android.net.Uri.encode(value));
    }
    @Override public void onBackPressed(){ if(webView!=null&&webView.canGoBack()) webView.goBack(); else finish(); }
    @Override protected void onDestroy(){ if(webView!=null){webView.stopLoading();webView.destroy();webView=null;} MainActivity main=MainActivity.getCurrentInstance(); if(main!=null) main.notifyBrowserClosed(); super.onDestroy(); }
}
`;
}

const manifest = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let text = fs.readFileSync(manifest, 'utf8');
  if (!text.includes('VidGrabBrowserActivity')) {
    text = text.replace('</application>', '        <activity android:name=".VidGrabBrowserActivity" android:exported="false" android:screenOrientation="unspecified" />\n    </application>');
    fs.writeFileSync(manifest, text);
  }
}

fs.writeFileSync(file, source);
console.log('[native-browser] real Android WebView browser patched and declared');
