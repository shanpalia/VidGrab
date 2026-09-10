# VidGrab

VidGrab is a mobile-first media browser/downloader UI branded as **VidGrab** with **© Shan Palia**.

## Android storage

The Codemagic Android workflow generates a Capacitor Android shell and injects a native Android storage bridge.
On Android 10+, downloaded files are written through MediaStore into the public Downloads directory:

- `Download/VidGrab/Audio/`
- `Download/VidGrab/Video/`
- `Download/VidGrab/Image/`
- `Download/VidGrab/Others/`

The app also keeps a persistent IndexedDB copy for in-app playback. This means the VidGrab video/audio player can play the real downloaded bytes without going back to YouTube or another source URL.

On Android versions where public storage rules differ, the native bridge uses the appropriate legacy path behavior.

## Build with Codemagic

The included `codemagic.yaml` installs dependencies, builds the Vite app, generates the Capacitor Android project, applies the VidGrab native storage bridge and builds a **signed release APK named **VidGrab.apk****.

### Codemagic signing
1. In Codemagic, upload your Android release keystore under **Team settings → codemagic.yaml settings → Code signing identities → Android keystores**.
2. The workflow is already configured to use your available Codemagic Android keystore reference **`paliaapk-release`**.
3. Start the `vidgrab-android` workflow. The final artifact is `VidGrab.apk` (APK only; no AAB is generated). Codemagic supplies `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, and `CM_KEY_PASSWORD` to Gradle for the release build.
4. The only published artifact is `VidGrab.apk`. No AAB is generated.

Keep the same keystore for future updates so Android/Google Play accepts them as updates to the same app.

## Browser fallback

When running as a normal website, VidGrab continues to use persistent browser storage (IndexedDB) and the browser's download mechanism. A normal web page cannot silently create arbitrary folders in phone storage; the real `Download/VidGrab/...` folder behavior is provided by the Android native build.


## Download size / Vibe Player / Store fallback
- My Files records the actual downloaded byte size (`Blob.size`), not the backend estimate, so successful downloads do not appear as 0 KB.
- Android external playback uses the system player chooser titled `Play with Vibe Player or another player`; if Vibe Player is installed it can be selected.
- Set `VITE_PALIAAPK_HUB_STORE_URL` to the exact PaliaAPK HUB Store URL. It is intentionally not hard-coded because the exact store URL was not provided in this project.
