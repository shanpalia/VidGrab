import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.java');
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity.java not found');

let text = fs.readFileSync(mainActivity, 'utf8');
if (!text.includes('import android.graphics.Color;')) {
  text = text.replace('import android.content.ContentResolver;\n', 'import android.content.ContentResolver;\nimport android.graphics.Color;\n');
}

const oldBlock = '        super.onCreate(savedInstanceState);\n        if (bridge != null && bridge.getWebView() != null) {';
const newBlock = `        super.onCreate(savedInstanceState);\n\n        // Keep the WebView content below the status bar/camera cutout and above\n        // the navigation area. This prevents the VidGrab header from entering\n        // the front-camera/notch safe area on modern Android devices.\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            getWindow().setDecorFitsSystemWindows(false);\n        }\n        getWindow().setStatusBarColor(Color.WHITE);\n        getWindow().setNavigationBarColor(Color.WHITE);\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {\n            getWindow().getDecorView().setSystemUiVisibility(\n                android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR |\n                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0)\n            );\n        }\n\n        if (bridge != null && bridge.getWebView() != null) {\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                bridge.getWebView().setOnApplyWindowInsetsListener((view, insets) -> {\n                    android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars());\n                    view.setPadding(view.getPaddingLeft(), bars.top, view.getPaddingRight(), bars.bottom);\n                    return insets;\n                });\n                bridge.getWebView().requestApplyInsets();\n            }`;

if (text.includes(oldBlock) && !text.includes('camera cutout safe area')) {
  text = text.replace(oldBlock, newBlock);
}

fs.writeFileSync(mainActivity, text);
console.log('VidGrab Android edge-to-edge/camera-cutout safe-area patched.');
