import fs from 'node:fs';
import path from 'node:path';

const dir=path.join(process.cwd(),'android','app','src','main','java','com','shanpalia','vidgrab');
const mainFile=path.join(dir,'MainActivity.java');
const browserFile=path.join(dir,'VidGrabBrowserActivity.java');
if(!fs.existsSync(mainFile)||!fs.existsSync(browserFile))throw new Error('Native browser files not found');

let main=fs.readFileSync(mainFile,'utf8');
if(!main.includes('VIDGRAB_NATIVE_GRAB_V1')){
  const notifyOld=`    void notifyBrowserClosed() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('vidgrab-native-browser-closed'));", null));
        }
    }`;
  const notifyNew=`    private boolean browserGrabHandoff = false;
    void notifyBrowserClosed() {
        if (browserGrabHandoff) return;
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
`;
  if(main.includes(notifyOld)) main=main.replace(notifyOld,notifyNew);
  else throw new Error('notifyBrowserClosed block not found');
  main=main.replace('// VIDGRAB_NATIVE_BROWSER_V2','// VIDGRAB_NATIVE_BROWSER_V2\n// VIDGRAB_NATIVE_GRAB_V1');
  fs.writeFileSync(mainFile,main);
}

let browser=fs.readFileSync(browserFile,'utf8');
if(!browser.includes('VIDGRAB_NATIVE_GRAB_V1')){
  browser=browser.replace('    private TextView close;', '    private TextView close;');
  const toolbarNeedle='        TextView close = textButton("✕");';
  const toolbarReplacement='        TextView grab = textButton("GRAB");\n        grab.setTextColor(Color.rgb(220, 25, 35));\n\n        TextView close = textButton("✕");';
  if(!browser.includes(toolbarNeedle))throw new Error('Browser toolbar close control not found');
  browser=browser.replace(toolbarNeedle,toolbarReplacement);
  const addNeedle='        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));';
  const addReplacement='        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(grab, new LinearLayout.LayoutParams(dp(58), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));';
  if(!browser.includes(addNeedle))throw new Error('Browser toolbar layout not found');
  browser=browser.replace(addNeedle,addReplacement);
  const clickNeedle='        close.setOnClickListener(v -> finish());\n        webView.loadUrl(initial);';
  const clickReplacement='        close.setOnClickListener(v -> finish());\n        grab.setOnClickListener(v -> {\n            MainActivity main=MainActivity.getCurrentInstance();\n            if(main!=null){ main.notifyBrowserGrab(webView.getUrl()); finish(); }\n        });\n        webView.loadUrl(initial);\n        // VIDGRAB_NATIVE_GRAB_V1';
  if(!browser.includes(clickNeedle))throw new Error('Browser click handlers not found');
  browser=browser.replace(clickNeedle,clickReplacement);
  fs.writeFileSync(browserFile,browser);
}
console.log('[native-browser-grab] browser GRAB handoff generated');
