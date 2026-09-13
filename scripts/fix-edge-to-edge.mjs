import fs from 'node:fs';
import path from 'node:path';
import './native-browser-grab.mjs';

const androidDir=path.join(process.cwd(),'android','app','src','main');
const mainActivity=path.join(androidDir,'java','com','shanpalia','vidgrab','MainActivity.java');
const browserActivity=path.join(androidDir,'java','com','shanpalia','vidgrab','VidGrabBrowserActivity.java');
const manifest=path.join(androidDir,'AndroidManifest.xml');
if(!fs.existsSync(mainActivity))throw new Error('MainActivity.java not found');
if(!fs.existsSync(browserActivity))throw new Error('VidGrabBrowserActivity.java not found');
if(!fs.existsSync(manifest))throw new Error('AndroidManifest.xml not found');

const text=fs.readFileSync(mainActivity,'utf8');
const browserText=fs.readFileSync(browserActivity,'utf8');
const manifestText=fs.readFileSync(manifest,'utf8');

if(!text.includes('VIDGRAB_ANDROID_SAFE_AREA_V9'))throw new Error('Missing V9 safe-area patch.');
if(!text.includes('container.setOnApplyWindowInsetsListener'))throw new Error('Missing native container WindowInsets patch.');
if(!text.includes('VIDGRAB_ANDROID_SYSTEM_BARS_V9'))throw new Error('Missing V9 system-bar patch.');
if(!text.includes('setDecorFitsSystemWindows(false)'))throw new Error('Missing V9 edge-to-edge configuration.');
if(text.includes('VIDGRAB_ANDROID_INSETS_V8'))throw new Error('Obsolete V8 inset patch remains.');
if(!text.includes('VIDGRAB_ANDROID_BACK_V2'))throw new Error('Missing predictive browser Back interception.');
if(!text.includes('VidGrabAndroidBack'))throw new Error('Missing React browser Back bridge call.');
if(!text.includes('public boolean openBrowser(String url)'))throw new Error('Missing native browser bridge method.');
if(!browserText.includes('public class VidGrabBrowserActivity'))throw new Error('Native browser Activity is not public.');
if(!browserText.includes('VIDGRAB_NATIVE_BROWSER_V2'))throw new Error('Missing native browser Activity V2 marker.');
if(!browserText.includes('VIDGRAB_NATIVE_GRAB_V1'))throw new Error('Missing browser GRAB control.');
if(!text.includes('notifyBrowserGrab(String url)'))throw new Error('Missing native browser GRAB handoff method.');
if(!browserText.includes('main.notifyBrowserGrab(webView.getUrl())'))throw new Error('Missing browser GRAB click handoff.');
if(!browserText.includes('webView.canGoBack()'))throw new Error('Native browser Back history handling missing.');
if(!browserText.includes('setNestedScrollingEnabled(true)'))throw new Error('Native browser scrolling configuration missing.');
if(!manifestText.includes('VidGrabBrowserActivity'))throw new Error('Native browser Activity is not declared in AndroidManifest.xml.');

function verifyJava(text,name){
  let depth=0,inString=false,escaped=false,inLine=false,inBlock=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(inLine){if(c==='\n')inLine=false;continue}
    if(inBlock){if(c==='*'&&n==='/'){inBlock=false;i++}continue}
    if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue}
    if(c==='/'&&n==='/'){inLine=true;i++;continue}
    if(c==='/'&&n==='*'){inBlock=true;i++;continue}
    if(c==='"'){inString=true;continue}
    if(c==='{')depth++;
    if(c==='}'){depth--;if(depth<0)throw new Error(`${name} has an extra closing brace.`)}
  }
  if(inString||inBlock||depth!==0)throw new Error(`${name} has unbalanced syntax (brace depth: ${depth}).`);
}

verifyJava(text,'Generated MainActivity.java');
verifyJava(browserText,'Generated VidGrabBrowserActivity.java');
console.log('VidGrab Android V9 safe-area, public native browser, GRAB handoff and predictive Back patches verified successfully.');
