// Wording for the consent screens shown before the first scan.
// Keep it true to what the app does — check here when scanning or saving
// changes (src/screens/ScanScreen.tsx, ARViewerScreen.tsx, the designs
// backend).
import {INCLUDE_FURNITURE_IN_SCANS} from './scan';

export const ROOM_DATA_CONSENT = {
  title: 'Your room data',
  intro:
    'Scanning creates a 3D model of your room. Here’s what that means for your data.',
  points: [
    'The scan captures your room’s shape: walls, floor, doors and windows. No photos or video are kept.',
    INCLUDE_FURNITURE_IN_SCANS
      ? 'Furniture is captured as simple boxes.'
      : 'Furniture is only outlined to help the scan, and removed from your finished room.',
    'The scan is processed on your phone. Nothing is uploaded until you save a design.',
    'When you save, the 3D room, furniture layout and a preview image are stored with your account.',
    'Saved designs are private unless you choose to publish them to Explore, where anyone can see them.',
    'You can delete a saved design at any time, which removes its files.',
  ],
  footnote: 'Read our Privacy Policy',
  acceptLabel: 'I agree',
};

// The one screen before the first scan: what a scan captures and stores,
// and the camera. Agreeing saves roomDataConsentAt and then iOS asks for
// the camera (its message is NSCameraUsageDescription in ios/fe/Info.plist;
// keep the two consistent). ROOM_DATA_CONSENT above is still used for
// rooms typed in by hand, where no camera is involved.
export const SCAN_CONSENT = {
  title: 'Before you scan',
  intro:
    'PlaDomus uses your camera and your iPhone’s depth sensor to measure your room and build a 3D model of its walls, doors, windows and layout.',
  points: [
    'Camera images stay on your device.',
    'We save the 3D model and its dimensions to your account so you can plan and return to your design.',
    'Designs stay private unless you publish them to Explore.',
    'You can delete your account and all your data from Settings at any time.',
  ],
  footnote: 'Privacy Policy',
  acceptLabel: 'Allow camera',
  // When the camera is already allowed (e.g. an account that scanned
  // before this screen existed), the button only records the agreement.
  acceptLabelCameraAllowed: 'Continue',
};

export const CAMERA_BLOCKED = {
  title: 'Camera access is off',
  intro:
    'Scanning needs your camera. You can turn it on in Settings, then come back here.',
  points: [
    'Open Settings → PlaDomus and switch on Camera.',
    'Prefer not to? You can enter your room’s measurements instead.',
  ],
  acceptLabel: 'Open Settings',
};

// Blocked by Screen Time or device management: the app's Settings page
// can't switch it on, so don't send them there.
export const CAMERA_RESTRICTED = {
  title: 'Camera is restricted',
  intro:
    'Camera access is blocked on this iPhone by Screen Time or a device manager, so scanning isn’t available.',
  points: [
    'Whoever manages this iPhone can allow the camera in Settings → Screen Time.',
    'You can still enter your room’s measurements instead.',
  ],
  acceptLabel: 'Back',
};
