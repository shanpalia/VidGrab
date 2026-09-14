import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'android','app','src','main','java','com','shanpalia','vidgrab','MainActivity.java');
if(!fs.existsSync(file))throw new Error('MainActivity.java not found');
let source=fs.readFileSync(file,'utf8');

source=source.replace('VIDGRAB_ANDROID_SAFE_AREA_V5','VIDGRAB_ANDROID_SAFE_AREA_V9');
source=source.replace('VIDGRAB_ANDROID_SAFE_AREA_V8','VIDGRAB_ANDROID_SAFE_AREA_V9');
source=source.replace('VIDGRAB_ANDROID_SAFE_AREA_V7','VIDGRAB_ANDROID_SAFE_AREA_V9');
source=source.replace('getWindow().setDecorFitsSystemWindows(true);','getWindow().setDecorFitsSystemWindows(false);');

source=source.replace('        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().setPadding(0, 0, 0, 0);',`        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setPadding(0, 0, 0, 0);

            // VIDGRAB_ANDROID_SYSTEM_BARS_V9
            getWindow().setStatusBarColor(Color.rgb(248, 250, 252));
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                getWindow().getDecorView().setSystemUiVisibility(flags);
            }
            final android.view.View webView=bridge.getWebView();
            final android.view.ViewParent parent=webView.getParent();
            if(parent instanceof android.view.ViewGroup){
                final android.view.ViewGroup container=(android.view.ViewGroup)parent;
                container.setBackgroundColor(Color.rgb(248,250,252));
                container.setOnApplyWindowInsetsListener((view,insets)->{
                    int top;
                    if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.R){
                        android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.statusBars()|android.view.WindowInsets.Type.displayCutout());
                        top=bars.top;
                    }else{top=insets.getSystemWindowInsetTop();}
                    view.setPadding(0,top,0,0);return insets;
                });
                container.requestApplyInsets();
            }`);

source=source.replace(/\n\s*\/\/ VIDGRAB_ANDROID_INSETS_V8:[\s\S]*?bridge\.getWebView\(\)\.requestApplyInsets\(\);/,'');
source=source.replace(/\n\s*\/\/ VIDGRAB_ANDROID_INSETS_V9:[\s\S]*?bridge\.getWebView\(\)\.requestApplyInsets\(\);/,'');

if(!source.includes('getClipboardText()')){
  const anchor='    @JavascriptInterface\n    public String getDownloadRoot()';
  const method=`    @JavascriptInterface
    public String getClipboardText() {
        try {
            android.content.ClipboardManager cm=(android.content.ClipboardManager)activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            if(cm==null||!cm.hasPrimaryClip())return "";
            android.content.ClipData clip=cm.getPrimaryClip();
            if(clip==null||clip.getItemCount()==0)return "";
            CharSequence text=clip.getItemAt(0).coerceToText(activity);
            return text==null?"":text.toString();
        }catch(Exception e){return "";}
    }

`;
  source=source.replace(anchor,method+anchor);
}

if(!source.includes('VIDGRAB_ANDROID_BACK_V2')){
  source=source.replace('import com.getcapacitor.BridgeActivity;','import com.getcapacitor.BridgeActivity;\nimport androidx.activity.OnBackPressedCallback;');
  const anchor='        super.onCreate(savedInstanceState);';
  const code=`        super.onCreate(savedInstanceState);

        // VIDGRAB_ANDROID_BACK_V2
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "(function(){if(window.VidGrabAndroidBack){window.VidGrabAndroidBack();return true;}return false;})()",
                        value -> {}
                    );
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });`;
  source=source.replace(anchor,code);
}

if(!source.includes('VIDGRAB_SYSTEM_NAV_HIDDEN_V1')){
  source=source.replace('public class MainActivity extends BridgeActivity {','public class MainActivity extends BridgeActivity {\n    // VIDGRAB_SYSTEM_NAV_HIDDEN_V1');
  const hide=`
    private void hideVidGrabSystemNavigation() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.view.WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    controller.hide(android.view.WindowInsets.Type.navigationBars());
                }
            } else {
                getWindow().getDecorView().setSystemUiVisibility(
                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                );
            }
        } catch (Exception ignored) {}
    }
`;
  const mainClose='\n}\n\nclass VidGrabNative';
  const mainCloseIndex=source.indexOf(mainClose);
  if(mainCloseIndex<0)throw new Error('MainActivity class boundary not found');
  source=source.slice(0,mainCloseIndex)+hide+source.slice(mainCloseIndex);
}

if(!source.includes('hideVidGrabSystemNavigation();')){
  source=source.replace('        super.onCreate(savedInstanceState);','        super.onCreate(savedInstanceState);\n        hideVidGrabSystemNavigation();',1);
}

if(!source.includes('VIDGRAB_MAIN_RESUME_NAV_V1')){
  const resume=`
    // VIDGRAB_MAIN_RESUME_NAV_V1
    @Override public void onResume() {
        super.onResume();
        hideVidGrabSystemNavigation();
    }
`;
  const mainClose='\n}\n\nclass VidGrabNative';
  const mainCloseIndex=source.indexOf(mainClose);
  if(mainCloseIndex<0)throw new Error('MainActivity class boundary not found for resume callback');
  source=source.slice(0,mainCloseIndex)+resume+source.slice(mainCloseIndex);
}

if(!source.includes('VIDGRAB_MAIN_FOCUS_NAV_V1')){
  const focus=`
    // VIDGRAB_MAIN_FOCUS_NAV_V1
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideVidGrabSystemNavigation();
    }
`;
  const mainClose='\n}\n\nclass VidGrabNative';
  const mainCloseIndex=source.indexOf(mainClose);
  if(mainCloseIndex<0)throw new Error('MainActivity class boundary not found for focus callback');
  source=source.slice(0,mainCloseIndex)+focus+source.slice(mainCloseIndex);
}

fs.writeFileSync(file,source);
console.log('[native] VidGrab V9 safe area + browser back + persistent immersive navigation hiding applied to MainActivity');
