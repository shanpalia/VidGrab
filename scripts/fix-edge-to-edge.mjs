import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity.java not found');

let text = fs.readFileSync(mainActivity, 'utf8');
if (!text.includes('import android.graphics.Color;')) {
  text = text.replace('import android.content.ContentResolver;\n', 'import android.content.ContentResolver;\nimport android.graphics.Color;\n');
}

const marker = 'VIDGRAB_INSETS_PATCH_V3';
if (!text.includes(marker)) {
  const anchor = '        super.onCreate(savedInstanceState);';
  const bridgeIf = '        if (bridge != null && bridge.getWebView() != null) {';
  const start = text.indexOf(anchor);
  const bridgeStart = text.indexOf(bridgeIf, start);
  if (start < 0 || bridgeStart < 0) throw new Error('Could not locate MainActivity onCreate block.');

  const safeBlock = `        super.onCreate(savedInstanceState);\n\n        // ${marker}: Android 15 edge-to-edge and camera/display-cutout safe area.\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            getWindow().setDecorFitsSystemWindows(false);\n        }\n        getWindow().setStatusBarColor(Color.WHITE);\n        getWindow().setNavigationBarColor(Color.WHITE);\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {\n            int flags = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {\n                flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;\n            }\n            getWindow().getDecorView().setSystemUiVisibility(flags);\n        }\n\n        android.view.View decor = getWindow().getDecorView();\n        decor.setOnApplyWindowInsetsListener((view, insets) -> {\n            if (bridge != null && bridge.getWebView() != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                android.graphics.Insets safe = insets.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());\n                android.view.View webView = bridge.getWebView();\n                webView.setPadding(0, safe.top, 0, safe.bottom);\n            }\n            return insets;\n        });\n\n`;
  text = text.slice(0, start) + safeBlock + text.slice(bridgeStart);
}

fs.writeFileSync(mainActivity, text);
console.log('VidGrab Android edge-to-edge/camera-cutout safe-area patched V3.');
