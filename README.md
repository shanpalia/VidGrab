# VidGrab — CodeMagic Ready

VidGrab — Grab. Save. Enjoy. — By ShanPalia.

## Build
- Gradle wrapper: 9.3.1
- Java: 17
- Package: `com.shanpalia.vidgrab`
- CodeMagic workflows: `vidgrab-debug`, `vidgrab-release`

## App update manifest
Publish `vidgrab-update.json` at:
`https://shanpalia.github.io/WebsitePaliaAPK_V.2/vidgrab-update.json`

The app checks the GitHub Pages URL first, then the GitHub raw `main`/`master` URLs as fallbacks. Keep the JSON package name exactly `com.shanpalia.vidgrab`.

For each release, update:
- `latestVersionCode`
- `latestVersionName`
- `releaseNotes`
- `apkUrl`
- optionally `sha256`

The current project manifest is included at the repository root as `vidgrab-update.json` and is set to version 1.0.4 / versionCode 4. Copy that file to the website repository when publishing the first manifest.

## Download UI
The Media Found screen now opens a quality chooser when the user taps VIDEO or AUDIO. It no longer immediately selects the first/best format, and the quick-action labels are compact for narrow phones. Individual quality cards still have Save buttons.

## Important
A release APK must be signed with the same signing key as the installed VidGrab app to install as an update. CodeMagic signing must be configured for release builds.
