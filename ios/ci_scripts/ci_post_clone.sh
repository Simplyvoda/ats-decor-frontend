#!/bin/sh
#
# Xcode Cloud resolves Swift Package Manager dependencies automatically, but
# not CocoaPods — this project uses CocoaPods, so without this script the
# build fails immediately looking for Pods/Target Support Files/*.xcconfig
# that only exist after `pod install` has run.
#
# Xcode Cloud runs this automatically after cloning the repo, before the
# build starts. See: https://developer.apple.com/documentation/xcode/writing-custom-build-scripts

set -e

# Xcode Cloud images ship Node via nvm, but it isn't on PATH for custom
# scripts by default — source it explicitly. Fall back to Homebrew if it's
# still missing.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! command -v node &> /dev/null; then
  brew install node
fi

if ! command -v pod &> /dev/null; then
  sudo gem install cocoapods
fi

# The Podfile resolves react-native autolinking via node_modules — install
# JS deps before pod install, not just the pods themselves.
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

cd ios

# CocoaPods' trunk CDN repo isn't cached on Xcode Cloud's ephemeral build
# machines, so every build re-validates it from scratch against
# raw.githubusercontent.com — a step that occasionally times out
# (transient GitHub CDN flakiness, not a project issue). Retry a few times
# with backoff instead of failing the whole build on one bad fetch.
attempt=1
max_attempts=5
until pod install; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "pod install failed after $attempt attempts" >&2
    exit 1
  fi
  wait_seconds=$((attempt * 15))
  echo "pod install failed (attempt $attempt/$max_attempts) — retrying in ${wait_seconds}s..." >&2
  sleep "$wait_seconds"
  attempt=$((attempt + 1))
done
