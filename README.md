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

The included `codemagic.yaml` installs dependencies, builds the Vite app, generates the Capacitor Android project, applies the VidGrab native storage bridge and builds a debug APK.

For a release APK/AAB, configure Android signing in Codemagic and change the Gradle task in the workflow to the desired release task.

## Browser fallback

When running as a normal website, VidGrab continues to use persistent browser storage (IndexedDB) and the browser's download mechanism. A normal web page cannot silently create arbitrary folders in phone storage; the real `Download/VidGrab/...` folder behavior is provided by the Android native build.
