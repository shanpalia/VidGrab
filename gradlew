#!/bin/sh
set -eu
APP_HOME=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GRADLE_VERSION=9.3.1
DIST="$HOME/.gradle/vidgrab-dist/gradle-$GRADLE_VERSION"
if [ ! -x "$DIST/bin/gradle" ]; then
  mkdir -p "$HOME/.gradle/vidgrab-dist"
  TMP="$HOME/.gradle/vidgrab-dist/gradle-$GRADLE_VERSION-bin.zip"
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 --connect-timeout 20 -o "$TMP" "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$TMP" "https://services.gradle.org/distributions/gradle-$GRADLE_VERSION-bin.zip"
  else
    echo "Gradle $GRADLE_VERSION is not installed and neither curl nor wget is available." >&2
    exit 1
  fi
  rm -rf "$DIST"
  unzip -q "$TMP" -d "$HOME/.gradle/vidgrab-dist"
fi
exec "$DIST/bin/gradle" "$@"
