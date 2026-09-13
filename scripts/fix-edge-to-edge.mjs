import fs from 'node:fs';
import path from 'node:path';
const mainActivity=path.join(process.cwd(),'android','app','src','main','java','com','shanpalia','vidgrab','MainActivity.java');
if(!fs.existsSync(mainActivity))throw new Error('MainActivity.java not found');
const text=fs.readFileSync(mainActivity,'utf8');
if(!text.includes('VIDGRAB_ANDROID_SAFE_AREA_V9'))throw new Error('Missing V9 safe-area patch.');
if(!text.includes('container.setOnApplyWindowInsetsListener'))throw new Error('Missing native container WindowInsets patch.');
if(!text.includes('VIDGRAB_ANDROID_SYSTEM_BARS_V9'))throw new Error('Missing V9 system-bar patch.');
if(!text.includes('setDecorFitsSystemWindows(false)'))throw new Error('Missing V9 edge-to-edge configuration.');
if(text.includes('VIDGRAB_ANDROID_INSETS_V8'))throw new Error('Obsolete V8 inset patch remains.');
if(!text.includes('VIDGRAB_ANDROID_BACK_V2'))throw new Error('Missing predictive browser Back interception.');
if(!text.includes('VidGrabAndroidBack'))throw new Error('Missing React browser Back bridge call.');
let depth=0,inString=false,escaped=false,inLine=false,inBlock=false;
for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(inLine){if(c==='\n')inLine=false;continue}if(inBlock){if(c==='*'&&n==='/'){inBlock=false;i++}continue}if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue}if(c==='/'&&n==='/'){inLine=true;i++;continue}if(c==='/'&&n==='*'){inBlock=true;i++;continue}if(c==='"'){inString=true;continue}if(c==='{')depth++;if(c==='}'){depth--;if(depth<0)throw new Error('Generated MainActivity.java has an extra closing brace.')}}
if(inString||inBlock||depth!==0)throw new Error(`Generated MainActivity.java has unbalanced syntax (brace depth: ${depth}).`);
console.log('VidGrab Android V9 native safe-area and predictive browser Back patch verified successfully.');
