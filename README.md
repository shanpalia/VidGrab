# VidGrab

**VidGrab — Grab. Save. Enjoy.**

By ShanPalia

VidGrab is a native Android media utility with a responsive light theme, browser shortcuts, URL analysis flow, download manager, audio extraction, media player and history.

## Build locally

Requirements:
- Android Studio
- JDK 17
- Android SDK 36

Open the repository root in Android Studio and sync Gradle.

Debug APK:

```bash
./gradlew assembleDebug
```

Release APK:

```bash
./gradlew assembleRelease
```

Release AAB:

```bash
./gradlew bundleRelease
```

Outputs are under `app/build/outputs/`.

## CodeMagic

A `codemagic.yaml` is included. The debug workflow builds an installable debug APK. The release workflow builds APK and AAB; for Play Store distribution, configure an Android keystore in CodeMagic and connect it to the release workflow.

The project is configured to use JDK 17 and Gradle 9.3.1, which matches Android Gradle Plugin 9.1.x compatibility.

## URL paste

The Home screen uses Android's system ClipboardManager. The Paste button, long-press paste, clipboard detection and Paste & Analyze flow update the actual URL field state.

## Download policy

VidGrab must only download content that the user is authorized to download and publicly/technically available through an allowed mechanism. It does not bypass DRM, private-account restrictions, authentication, paywalls or other technical protections.

## Branding
- Launcher icon: VidGrab original V/play/download logo.
- Splash screen: white background with VidGrab logo.
- CodeMagic is build-only and is not used as app branding.

## VidGrab App Updates

Host a file named `vidgrab-update.json` on the GitHub Pages site at:
`https://shanpalia.github.io/WebsitePaliaAPK_V.2/vidgrab-update.json`

Use `vidgrab-update.json.example` in this project as the template. For each release, update `latestVersionCode`, `latestVersionName`, `releaseNotes`, and `apkUrl`, then upload the new release APK as `VidGrab.apk`. The app checks this manifest from Settings > App Update and only shows Update Now when the remote versionCode is newer.
