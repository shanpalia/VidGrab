import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity.java not found');

let text = fs.readFileSync(mainActivity, 'utf8');
if (!text.includes('import android.graphics.Color;')) text = text.replace('import android.content.ContentResolver;\n', 'import android.content.ContentResolver;\nimport android.graphics.Color;\n');
if (!text.includes('import android.view.View;')) text = text.replace('import android.webkit.JavascriptInterface;\n', 'import android.webkit.JavascriptInterface;\nimport android.view.View;\n');

const start = text.indexOf('    @Override\n    public void onCreate(Bundle savedInstanceState) {');
const end = text.indexOf('\n    }\n}\n\nclass VidGrabNative', start);
if (start === -1 || end === -1) throw new Error('Unable to locate MainActivity.onCreate');

const method = `    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        }
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }

        View decor = getWindow().getDecorView();
        decor.setOnApplyWindowInsetsListener((view, insets) -> {
            int top = 0;
            int bottom = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                top = bars.top;
                bottom = bars.bottom;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && insets.getDisplayCutout() != null) {
                top = insets.getDisplayCutout().getSafeInsetTop();
                bottom = insets.getDisplayCutout().getSafeInsetBottom();
            }
            if (bridge != null && bridge.getWebView() != null) {
                View webView = bridge.getWebView();
                webView.setPadding(webView.getPaddingLeft(), top, webView.getPaddingRight(), bottom);
            }
            return insets;
        });

        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().getSettings().setJavaScriptEnabled(true);
            bridge.getWebView().getSettings().setDomStorageEnabled(true);
            bridge.getWebView().addJavascriptInterface(new VidGrabNative(this), "VidGrabNative");
            bridge.getWebView().post(() -> decor.requestApplyInsets());
        }
        decor.post(() -> decor.requestApplyInsets());
    }`;
text = text.slice(0, start) + method + text.slice(end + 6);
fs.writeFileSync(mainActivity, text);
console.log('VidGrab camera/display-cutout safe-area patch ready.');
