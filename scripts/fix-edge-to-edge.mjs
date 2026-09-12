import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity.java not found');

let text = fs.readFileSync(mainActivity, 'utf8');
if (!text.includes('import android.graphics.Color;')) {
  text = text.replace('import android.content.ContentResolver;\n', 'import android.content.ContentResolver;\nimport android.graphics.Color;\n');
}

const marker = 'VIDGRAB_INSETS_PATCH_V2';
if (!text.includes(marker)) {
  const start = text.indexOf('        super.onCreate(savedInstanceState);');
  if (start >= 0) {
    const bridgeStart = text.indexOf('        if (bridge != null && bridge.getWebView() != null) {', start);
    if (bridgeStart >= 0) {
      const replacement = `        super.onCreate(savedInstanceState);\n\n        // ${marker}: handle Android 15 edge-to-edge and camera/display cutout safely.\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            getWindow().setDecorFitsSystemWindows(false);\n        }\n        getWindow().setStatusBarColor(Color.WHITE);\n        getWindow().setNavigationBarColor(Color.WHITE);\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {\n            int flags = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {\n                flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;\n            }\n            getWindow().getDecorView().setSystemUiVisibility(flags);\n        }\n\n        android.view.View decor = getWindow().getDecorView();\n        decor.setOnApplyWindowInsetsListener((view, insets) -> {\n            android.graphics.Insets bars;\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());\n            } else {\n                bars = android.graphics.Insets.of(0, 0, 0, 0);\n            }\n            if (bridge != null && bridge.getWebView() != null) {\n                android.view.View webView = bridge.getWebView();\n                webView.setPadding(webView.getPaddingLeft(), bars.top, webView.getPaddingRight(), bars.bottom);\n            }\n            return insets;\n        });\n\n        decor.post(() -> {\n            if (bridge != null && bridge.getWebView() != null) {\n                bridge.getWebView().requestApplyInsets();\n            }\n            decor.requestApplyInsets();\n        });\n\n        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().setOnApplyWindowInsetsListener((view, insets) -> {\n                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                    android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());\n                    view.setPadding(view.getPaddingLeft(), bars.top, view.getPaddingRight(), bars.bottom);\n                }\n                return insets;\n            });\n            bridge.getWebView().post(() -> bridge.getWebView().requestApplyInsets());\n        }\n`;
      text = text.slice(0, start) + replacement + text.slice(bridgeStart + '        if (bridge != null && bridge.getWebView() != null) {'.length);
    }
  }
}

fs.writeFileSync(mainActivity, text);
console.log('VidGrab Android edge-to-edge/camera-cutout safe-area patched V2.');
