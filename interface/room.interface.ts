export type RoomSource = 'scanned' | 'manual' | 'template';
export type RoomStatus = 'active' | 'locked';
// Lowest to highest; see be/src/rooms/room-spec.ts
export type RoomAccuracy = 'unknown' | 'typed' | 'scanned';

// Room geometry from the room builder (buildRoomSpec in
// src/screens/room_builder/roomGeometry.ts). Metres.
export interface IRoomSpec {
  shape?: 'rectangle' | 'square' | 'lshape';
  points: {x: number; y: number}[];
  ceilingHeight: number;
  openings: {
    type: 'door' | 'window';
    wall: number;
    offset: number;
    width: number;
    sill: number;
    height: number;
  }[];
}

export interface IRoom {
  id: string;
  user_id: string;
  name: string;
  source: RoomSource;
  accuracy: RoomAccuracy;
  status: RoomStatus;
  spec: IRoomSpec | null;
  model_url: string;
  thumbnail_url: string | null;
  // Set when the last dimension edit can be undone
  previous_model_path: string | null;
  design_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface IRoomResponse {
  status: string;
  message: string;
  data: IRoom;
}

export interface IRoomsResponse {
  status: string;
  message: string;
  data: IRoom[];
}
