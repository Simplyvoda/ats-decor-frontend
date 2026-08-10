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
pod install
