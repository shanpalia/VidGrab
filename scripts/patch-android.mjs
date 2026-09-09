import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'android');
if (!fs.existsSync(android)) throw new Error('Android project was not generated.');

const javaDir = path.join(android, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab');
fs.mkdirSync(javaDir, { recursive: true });

const activity = `package com.shanpalia.vidgrab;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().getSettings().setJavaScriptEnabled(true);
            bridge.getWebView().getSettings().setDomStorageEnabled(true);
            bridge.getWebView().addJavascriptInterface(new VidGrabNative(this), "VidGrabNative");
        }
    }
}

class VidGrabNative {
    private final MainActivity activity;
    VidGrabNative(MainActivity activity) { this.activity = activity; }

    private String categoryFolder(String category) {
        if ("Audio".equalsIgnoreCase(category)) return "Audio";
        if ("Image".equalsIgnoreCase(category)) return "Image";
        if ("Video".equalsIgnoreCase(category)) return "Video";
        return "Others";
    }

    @JavascriptInterface
    public String getDownloadRoot() {
        return Environment.DIRECTORY_DOWNLOADS + "/VidGrab";
    }

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
                            new String[]{".vidgrab-folder", relative + "/"},
                            null)) {
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
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            return Uri.fromFile(file).toString();
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public boolean deleteFile(String uriString) {
        try {
            Uri uri = Uri.parse(uriString);
            if ("content".equalsIgnoreCase(uri.getScheme())) {
                return activity.getContentResolver().delete(uri, null, null) > 0;
            }
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                File f = new File(uri.getPath());
                return f.delete();
            }
            return false;
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface
    public boolean openFile(String uriString, String mimeType) {
        try {
            Uri uri = Uri.parse(uriString);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType == null ? "*/*" : mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);
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

// Remove any generated Kotlin MainActivity so there is only one Activity class.
const generatedKotlin = path.join(android, 'app', 'src', 'main', 'java', 'com', 'shanpalia', 'vidgrab', 'MainActivity.kt');
if (fs.existsSync(generatedKotlin)) fs.unlinkSync(generatedKotlin);

// Copy the supplied VidGrab icon into drawable and make it the app icon.
const sourceIcon = path.join(root, 'public', 'vidgrab-icon.png');
const drawableDir = path.join(android, 'app', 'src', 'main', 'res', 'drawable');
fs.mkdirSync(drawableDir, { recursive: true });
fs.copyFileSync(sourceIcon, path.join(drawableDir, 'vidgrab_icon.png'));

const manifest = path.join(android, 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let text = fs.readFileSync(manifest, 'utf8');
  text = text.replace(/android:icon="@[^"]+"/, 'android:icon="@drawable/vidgrab_icon"');
  fs.writeFileSync(manifest, text);
}

console.log('VidGrab Android native storage bridge patched.');
