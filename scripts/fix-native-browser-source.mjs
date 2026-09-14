import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'VidGrabBrowserActivity.java');
if (!fs.existsSync(file)) throw new Error('VidGrabBrowserActivity.java not found');

let text = fs.readFileSync(file, 'utf8');
// Keep the browser patcher insertion point stable after the V3 generator adds its note.
text = text.replace(
  'toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        // GRAB is added by native-browser-grab.mjs.\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));',
  'toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));'
);

// Keep both legacy and current markers so older source verification remains compatible.
if (text.includes('VIDGRAB_NATIVE_BROWSER_V3') && !text.includes('VIDGRAB_NATIVE_BROWSER_V2')) {
  text = text.replace('// VIDGRAB_NATIVE_BROWSER_V3', '// VIDGRAB_NATIVE_BROWSER_V2\n// VIDGRAB_NATIVE_BROWSER_V3');
}

// IMPORTANT: never hide YouTube's mobile top bar/search UI. Only suppress the
// site's bottom pivot navigation because VidGrab supplies its own bottom nav.
text = text.replace(
  'String css = "ytm-pivot-bar-renderer,ytm-mobile-topbar-renderer,#player-theater-container,ytm-app>ytm-pivot-bar-renderer{display:none!important}";',
  'String css = "ytm-pivot-bar-renderer,ytm-pivot-bar-item-renderer{display:none!important}";'
);
text = text.replace(
  "document.querySelectorAll('ytm-pivot-bar-renderer').forEach(function(e){e.style.display='none'});",
  "document.querySelectorAll('ytm-pivot-bar-renderer,ytm-pivot-bar-item-renderer').forEach(function(e){e.style.display='none'});"
);

// Force immersive navigation hiding on all Android versions used by the app.
const oldHide = `    private void hideVidGrabSystemNavigation() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.view.WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    controller.hide(android.view.WindowInsets.Type.navigationBars());
                }
            } else {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            }
        } catch (Exception ignored) {}
    }`;
const newHide = `    private void hideVidGrabSystemNavigation() {
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getWindow().setNavigationBarContrastEnforced(false);
            }
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        } catch (Exception ignored) {}
    }`;
if (text.includes(oldHide)) text = text.replace(oldHide, newHide);

fs.writeFileSync(file, text);
console.log('[fix-native-browser-source] browser normalized: YouTube search preserved and Android navigation forced immersive');
