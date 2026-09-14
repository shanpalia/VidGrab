import fs from 'fs';
import path from 'path';

const root = process.cwd();
const android = path.join(root, 'android');
const javaDir = path.join(android, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
fs.mkdirSync(javaDir, { recursive: true });

const activity = `package com.shanpalia.vidgrab;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static MainActivity currentInstance;

    public static MainActivity getCurrentInstance() {
        return currentInstance;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        currentInstance = this;
    }

    @Override
    public void onDestroy() {
        if (currentInstance == this) currentInstance = null;
        super.onDestroy();
    }

    public void openBrowser(String url) {
        try {
            Intent intent = new Intent(this, VidGrabBrowserActivity.class);
            intent.putExtra("url", url);
            startActivity(intent);
        } catch (Exception e) {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        }
    }

    public void notifyBrowserGrab(String url) {
        if (bridge == null || bridge.getWebView() == null) return;
        String safe = url == null ? "" : url.replace("\\", "\\\\").replace("\"", "\\\"");
        bridge.getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('vidgrab-native-grab',{detail:{url:\"" + safe + "\"}}));", null);
    }

    public void notifyBrowserClosed() {
        if (bridge == null || bridge.getWebView() == null) return;
        bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('vidgrab-native-browser-closed'));", null);
    }
}
`;
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), activity);

const gradleFile = path.join(android, 'app', 'build.gradle');
if (fs.existsSync(gradleFile)) {
  let gradle = fs.readFileSync(gradleFile, 'utf8');

  // Only configure Codemagic signing when all four CM_* values exist.
  // GitHub Actions intentionally builds an unsigned release when they are absent.
  const signingKeys = [
    'CM_KEYSTORE_PATH',
    'CM_KEYSTORE_PASSWORD',
    'CM_KEY_ALIAS',
    'CM_KEY_PASSWORD'
  ];
  const signingReady = signingKeys.every((key) => Boolean(process.env[key]));

  if (signingReady && gradle.includes('android {')) {
    if (!gradle.includes('signingConfigs {')) {
      gradle = gradle.replace(
        /android\s*\{/,
        `android {
    signingConfigs {
        release {
            storeFile file(System.getenv('CM_KEYSTORE_PATH'))
            storePassword System.getenv('CM_KEYSTORE_PASSWORD')
            keyAlias System.getenv('CM_KEY_ALIAS')
            keyPassword System.getenv('CM_KEY_PASSWORD')
        }
    }`,
        1
      );
    }

    if (gradle.includes('buildTypes {') && !gradle.includes('signingConfig signingConfigs.release')) {
      gradle = gradle.replace(
        /buildTypes\s*\{\s*release\s*\{/,
        `buildTypes {
        release {
            signingConfig signingConfigs.release`,
        1
      );
    }
  }

  fs.writeFileSync(gradleFile, gradle);
}

const generatedKotlin = path.join(android, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.kt');
if (fs.existsSync(generatedKotlin)) fs.unlinkSync(generatedKotlin);

const sourceIcon = path.join(root, 'public', 'vidgrab-icon.png');
if (!fs.existsSync(sourceIcon)) throw new Error('VidGrab icon not found at public/vidgrab-icon.png');
const drawableDir = path.join(android, 'app', 'src', 'main', 'res', 'drawable');
fs.mkdirSync(drawableDir, { recursive: true });
fs.copyFileSync(sourceIcon, path.join(drawableDir, 'vidgrab_icon.png'));

const manifest = path.join(android, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let text = fs.readFileSync(manifest, 'utf8');
  text = text.replace(/android:icon="@[^"]+"/, 'android:icon="@drawable/vidgrab_icon"');
  if (/android:roundIcon="@[^"]+"/.test(text)) text = text.replace(/android:roundIcon="@[^"]+"/, 'android:roundIcon="@drawable/vidgrab_icon"');
  else text = text.replace(/(<application\b[^>]*)(>)/, '$1 android:roundIcon="@drawable/vidgrab_icon"$2');
  fs.writeFileSync(manifest, text);
}

console.log('VidGrab Android native bridge, storage, Vibe Player and launcher icon patched.');
