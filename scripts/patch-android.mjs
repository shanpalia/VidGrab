import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'android');
if (!fs.existsSync(android)) throw new Error('Android project was not generated.');

const javaDir = path.join(android, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
fs.mkdirSync(javaDir, { recursive: true });

const activity = `package com.shanpalia.vidgrab;

import android.content.ContentResolver;
import android.graphics.Color;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // VIDGRAB_ANDROID_SAFE_AREA_V5
        // Keep the WebView in the normal Android window area. This prevents
        // the HTML header/content from being drawn underneath the status bar,
        // punch-hole camera or display cutout on OnePlus and other devices.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(true);
        }
        getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }

        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setPadding(0, 0, 0, 0);
            bridge.getWebView().getSettings().setJavaScriptEnabled(true);
            bridge.getWebView().getSettings().setDomStorageEnabled(true);
            bridge.getWebView().addJavascriptInterface(new VidGrabNative(this), "VidGrabNative");
        }
    }
}

class VidGrabNative {
    private final MainActivity activity;
    private static final String VIBE_PLAYER_PACKAGE = "com.rehansurahyo.vibeplayer";

    VidGrabNative(MainActivity activity) { this.activity = activity; }

    private String categoryFolder(String category) {
        if ("Audio".equalsIgnoreCase(category)) return "Audio";
        if ("Image".equalsIgnoreCase(category)) return "Image";
        if ("Video".equalsIgnoreCase(category)) return "Video";
        return "Others";
    }

    @JavascriptInterface
    public String getDownloadRoot() { return Environment.DIRECTORY_DOWNLOADS + "/VidGrab"; }

    @JavascriptInterface
    public boolean ensureFolders() {
        try {
            String[] folders = {"Audio", "Video", "Image", "Others"};
            ContentResolver resolver = activity.getContentResolver();
            for (String folder : folders) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    String relative = Environment.DIRECTORY_DOWNLOADS + "/VidGrab/" + folder;
                    boolean exists = false;
                    try (android.database.Cursor cursor = resolver.query(
                            MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                            new String[]{MediaStore.Downloads._ID},
                            MediaStore.Downloads.DISPLAY_NAME + "=? AND " + MediaStore.Downloads.RELATIVE_PATH + "=?",
                            new String[]{".vidgrab-folder", relative + "/"}, null)) {
                        exists = cursor != null && cursor.moveToFirst();
                    }
                    if (!exists) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, ".vidgrab-folder");
                        values.put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream");
                        values.put(MediaStore.Downloads.RELATIVE_PATH, relative);
                        values.put(MediaStore.Downloads.IS_PENDING, 1);
                        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            ContentValues done = new ContentValues();
                            done.put(MediaStore.Downloads.IS_PENDING, 0);
                            resolver.update(uri, done, null, null);
                        }
                    }
                } else {
                    File base = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    File dir = new File(base, "VidGrab/" + folder);
                    if (!dir.exists()) dir.mkdirs();
                }
            }
            return true;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface
    public String saveFile(String category, String fileName, String mimeType, String base64) {
        try {
            String safeName = fileName == null ? "VidGrab_File" : fileName.replaceAll("[\\\\/:*?\\\"<>|]", "_");
            String folder = "VidGrab/" + categoryFolder(category);
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            ContentResolver resolver = activity.getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
            values.put(MediaStore.Downloads.MIME_TYPE, mimeType == null ? "application/octet-stream" : mimeType);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + folder);
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "";
                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) throw new Exception("Unable to open output stream");
                    out.write(bytes);
                }
                ContentValues done = new ContentValues();
                done.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(uri, done, null, null);
                return uri.toString();
            }
            File base = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File dir = new File(base, folder);
            if (!dir.exists() && !dir.mkdirs()) return "";
            File file = new File(dir, safeName);
            try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); }
            return Uri.fromFile(file).toString();
        } catch (Exception e) { return ""; }
    }

    @JavascriptInterface
    public boolean deleteFile(String uriString) {
        try {
            Uri uri = Uri.parse(uriString);
            if ("content".equalsIgnoreCase(uri.getScheme())) return activity.getContentResolver().delete(uri, null, null) > 0;
            if ("file".equalsIgnoreCase(uri.getScheme())) return new File(uri.getPath()).delete();
            return false;
        } catch (Exception e) { return false; }
    }

    private Intent buildViewIntent(Uri uri, String mimeType) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, mimeType == null ? "*/*" : mimeType);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return intent;
    }

    @JavascriptInterface
    public boolean isVibePlayerInstalled() {
        try {
            activity.getPackageManager().getPackageInfo(VIBE_PLAYER_PACKAGE, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) { return false; }
    }

    @JavascriptInterface
    public boolean openWithVibePlayer(String uriString, String mimeType) {
        try {
            Intent intent = buildViewIntent(Uri.parse(uriString), mimeType);
            intent.setPackage(VIBE_PLAYER_PACKAGE);
            if (intent.resolveActivity(activity.getPackageManager()) == null) return false;
            activity.startActivity(intent);
            return true;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface
    public boolean openFile(String uriString, String mimeType) {
        try {
            Intent intent = buildViewIntent(Uri.parse(uriString), mimeType);
            activity.startActivity(Intent.createChooser(intent, "Play with Vibe Player or another player"));
            return true;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface
    public boolean shareFile(String uriString, String mimeType, String title) {
        try {
            Uri uri = Uri.parse(uriString);
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mimeType == null ? "*/*" : mimeType);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(Intent.createChooser(intent, "Share " + (title == null ? "file" : title)));
            return true;
        } catch (Exception e) { return false; }
    }
}
`;
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), activity);

const gradleFile = path.join(android, 'app', 'build.gradle');
if (fs.existsSync(gradleFile)) {
  let gradle = fs.readFileSync(gradleFile, 'utf8');

  // Keep the generated Capacitor SDK values intact. The previous signing
  // patch called file(null) on GitHub Actions, which stops Gradle evaluation
  // before compileSdkVersion can even be read. Only configure signing when
  // all required signing variables are actually present.
  const signingReady = ['CM_KEYSTORE_PATH','CM_KEYSTORE_PASSWORD','CM_KEY_ALIAS','CM_KEY_PASSWORD']
    .every((key) => Boolean(process.env[key]));

  gradle = gradle.replace(/\n\s*signingConfigs\s*\{[\s\S]*?\n\s*\}\n(?=\s*buildTypes\s*\{)/, '\n');

  if (signingReady && gradle.includes('android {')) {
    gradle = gradle.replace(/android\s*\{/, `android {\n    signingConfigs {\n        release {\n            storeFile file(System.getenv('CM_KEYSTORE_PATH'))\n            storePassword System.getenv('CM_KEYSTORE_PASSWORD')\n            keyAlias System.getenv('CM_KEY_ALIAS')\n            keyPassword System.getenv('CM_KEY_PASSWORD')\n        }\n    }`, 1);
    if (gradle.includes('buildTypes {') && !gradle.includes('signingConfig signingConfigs.release')) {
      gradle = gradle.replace(/buildTypes\s*\{\s*release\s*\{/, `buildTypes {\n        release {\n            signingConfig signingConfigs.release`, 1);
    }
  } else {
    // GitHub Actions currently builds an unsigned release unless signing
    // secrets are supplied. This is intentional: never pass null to Gradle.
    gradle = gradle.replace(/buildTypes\s*\{\s*release\s*\{/, `buildTypes {\n        release {`, 1);
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

console.log('VidGrab Android native bridge, safe-area, storage, Vibe Player and launcher icon patched.');
`;

// The template generated by Capacitor owns compileSdk/minSdk/targetSdk.
// Do not overwrite those values here; only make the optional signing block safe.
