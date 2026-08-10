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

if ! command -v pod &> /dev/null; then
  sudo gem install cocoapods
fi

cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
