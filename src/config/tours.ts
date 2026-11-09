// What the guided tours say. Edit the wording here; GuidedTour shows it.
import {
  Armchair,
  Compass,
  DoorOpen,
  FileText,
  Footprints,
  Heart,
  PenTool,
  ScanLine,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import type {TourStep} from '../components/shared/GuidedTour';
import {INCLUDE_FURNITURE_IN_SCANS} from './scan';

// Shown once on the home screen, until the user finishes it.
export const APP_TOUR: TourStep[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Pladomus',
    body: 'Design your rooms in 3D and try furniture in your own space before you buy. Here’s a quick look around.',
  },
  {
    icon: PenTool,
    title: 'Start a design',
    body: 'Open the Design tab to scan a room with your camera, type in its measurements, or start from a house model.',
  },
  {
    icon: Armchair,
    title: 'Try furniture in your room',
    body: 'Place, move and rotate furniture in your 3D room, then save the design to come back to it any time.',
  },
  {
    icon: Compass,
    title: 'Get inspired',
    body: 'Explore shows designs other people have shared. You can publish your own there too.',
  },
  {
    icon: Heart,
    title: 'Save what you love',
    body: 'Tap the heart on any design in Explore to keep it in your moodboard.',
  },
  {
    icon: FileText,
    title: 'Keep notes',
    body: 'Use Notes for measurements, shopping lists and ideas while you plan.',
  },
];

// Shown on the scan screen before the first scan, until the user finishes it.
export const SCAN_TOUR: TourStep[] = [
  {
    icon: Sun,
    title: 'Turn the lights on',
    body: 'Scans work best in a bright room. Open curtains and switch on lamps if you can.',
  },
  {
    icon: Footprints,
    title: 'Move slowly',
    body: 'Start in a corner and walk around the room, pointing your camera at each wall from top to bottom.',
  },
  {
    icon: DoorOpen,
    title: 'Catch doors and windows',
    body: 'Pause on each door and window for a moment so they’re picked up in your 3D room.',
  },
  INCLUDE_FURNITURE_IN_SCANS
    ? {
        icon: Armchair,
        title: 'Furniture is included',
        body: 'The furniture in your room is captured as simple boxes, so you can see what’s already there.',
      }
    : {
        icon: Armchair,
        title: 'Furniture gets cleared',
        body: 'You’ll see your furniture outlined while scanning. That just helps the scan — we’ll remove it so you start with an empty room.',
      },
  {
    icon: ScanLine,
    title: 'Finish when you’re done',
    body: 'Tap the round button to start, and the tick when every wall is covered. You can restart at any time.',
  },
];
