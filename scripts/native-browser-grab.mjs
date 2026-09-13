import fs from 'node:fs';
import path from 'node:path';

const dir=path.join(process.cwd(),'android','app','src','main','java','com','shanpalia','vidgrab');
const mainFile=path.join(dir,'MainActivity.java');
const browserFile=path.join(dir,'VidGrabBrowserActivity.java');
if(!fs.existsSync(mainFile)||!fs.existsSync(browserFile))throw new Error('Native browser files not found');

let main=fs.readFileSync(mainFile,'utf8');
if(!main.includes('VIDGRAB_NATIVE_GRAB_V1')){
  const marker='// VIDGRAB_NATIVE_BROWSER_V2';
  if(!main.includes(marker))throw new Error('Native browser V2 marker not found');
  const closeStart=main.indexOf('void notifyBrowserClosed()');
  if(closeStart<0)throw new Error('notifyBrowserClosed method not found');
  const open=main.indexOf('{',closeStart);
  let depth=0,end=-1;
  for(let i=open;i<main.length;i++){ if(main[i]==='{')depth++; else if(main[i]==='}'){depth--;if(depth===0){end=i+1;break;}} }
  if(end<0)throw new Error('notifyBrowserClosed block has invalid braces');
  const replacement=`void notifyBrowserClosed() {
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
    }`;
  main=main.slice(0,closeStart)+'private boolean browserGrabHandoff = false;\n    '+replacement+main.slice(end);
  main=main.replace(marker,`${marker}\n// VIDGRAB_NATIVE_GRAB_V1`);
  fs.writeFileSync(mainFile,main);
}

let browser=fs.readFileSync(browserFile,'utf8');
if(!browser.includes('VIDGRAB_NATIVE_GRAB_V1')){
  const toolbarNeedle='        TextView close = textButton("✕");';
  if(!browser.includes(toolbarNeedle))throw new Error('Browser toolbar close control not found');
  browser=browser.replace(toolbarNeedle,'        TextView grab = textButton("GRAB");\n        grab.setTextColor(Color.rgb(220, 25, 35));\n\n        TextView close = textButton("✕");');
  const addNeedle='        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));';
  if(!browser.includes(addNeedle))throw new Error('Browser toolbar layout not found');
  browser=browser.replace(addNeedle,'        toolbar.addView(go, new LinearLayout.LayoutParams(dp(44), dp(46)));\n        toolbar.addView(grab, new LinearLayout.LayoutParams(dp(58), dp(46)));\n        toolbar.addView(close, new LinearLayout.LayoutParams(dp(42), dp(46)));');
  const clickNeedle='        close.setOnClickListener(v -> finish());\n        webView.loadUrl(initial);';
  if(!browser.includes(clickNeedle))throw new Error('Browser click handlers not found');
  browser=browser.replace(clickNeedle,'        close.setOnClickListener(v -> finish());\n        grab.setOnClickListener(v -> {\n            MainActivity main=MainActivity.getCurrentInstance();\n            if(main!=null){ main.notifyBrowserGrab(webView.getUrl()); finish(); }\n        });\n        webView.loadUrl(initial);\n        // VIDGRAB_NATIVE_GRAB_V1');
  fs.writeFileSync(browserFile,browser);
}
console.log('[native-browser-grab] browser GRAB handoff generated');
