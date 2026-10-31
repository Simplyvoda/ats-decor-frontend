// Room scan settings.
//
// INCLUDE_FURNITURE_IN_SCANS
//   false → saved scans keep only the room itself: walls, floor, doors,
//           windows and openings. Beds, sofas, tables etc. that RoomPlan
//           spots are dropped before the 3D file is written, and the scan
//           screen tells people that's happening.
//   true  → saved scans also include the furniture RoomPlan found (the
//           grey boxes), like before.
//
// While scanning, Apple's screen still outlines furniture and builds it
// in the mini preview either way; apps can't turn that off. So when
// furniture is off, ScanScreen explains it'll be cleared afterwards.
export const INCLUDE_FURNITURE_IN_SCANS = false;
