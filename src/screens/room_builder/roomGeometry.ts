// The maths behind the guided room builder: room shapes, wall lengths,
// corner points, and where doors and windows may go.
//
// Everything is in metres. The floor plan uses x to the right and y DOWN
// the screen, and walls are listed clockwise starting with the top wall,
// so wall A runs from corner 0 to corner 1, wall B from corner 1 to 2, etc.
// Standing inside the room facing any wall, its start corner is on your
// left — which is why positions read "x m from left".
//
// The same points and openings are drawn by FloorPlan and sent to the
// native RoomBuilderModule, which builds the 3D room from them.

export type RoomShape = 'rectangle' | 'square' | 'lshape';
export type OpeningType = 'door' | 'window';

export type Point = {x: number; y: number};

export type Opening = {
  id: string;
  type: OpeningType;
  // Index of the wall it sits in (0 = A)
  wall: number;
  // Distance from the wall's start (left) corner to the opening's near edge
  offset: number;
  width: number;
};

export const MIN_WALL = 0.5;
export const MAX_WALL = 30;
export const MIN_CEILING = 1.8;
export const MAX_CEILING = 5;
export const DEFAULT_CEILING = 2.4;

export const OPENING_LIMITS: Record<
  OpeningType,
  {min: number; max: number; default: number}
> = {
  door: {min: 0.6, max: 3, default: 0.9},
  window: {min: 0.3, max: 5, default: 1.2},
};

// Heights aren't asked for in the flow, so these standard ones are used
const DOOR_HEIGHT = 2.0;
const WINDOW_SILL = 0.9;
const WINDOW_HEIGHT = 1.2;

export const SHAPES: {id: RoomShape; label: string}[] = [
  {id: 'lshape', label: 'L-shape'},
  {id: 'rectangle', label: 'Rectangle'},
  {id: 'square', label: 'Square'},
];

export const wallLetter = (index: number) => String.fromCharCode(65 + index);

export const wallCount = (shape: RoomShape) => (shape === 'lshape' ? 6 : 4);

export const defaultLengths = (shape: RoomShape): number[] => {
  switch (shape) {
    case 'square':
      return [3.5, 3.5, 3.5, 3.5];
    case 'rectangle':
      return [4, 3, 4, 3];
    case 'lshape':
      return completeLengths('lshape', [5, 2, 2, 2]);
  }
};

// Walls the person types in. The rest follow from them: in a rectangle the
// opposite wall is the same length, in a square every wall is, and in an
// L-shape the last two walls (E, F) are worked out from A–D.
export const isWallEditable = (shape: RoomShape, index: number) =>
  shape !== 'lshape' || index < 4;

// L-shape, clockwise from the top-left corner (the bottom-right is cut out):
//
//   ┌──── A ────┐
//   │           B
//   F     ┌─ C ─┘
//   │     D
//   └─ E ─┘
//
// So E = A − C and F = B + D.
const completeLengths = (shape: RoomShape, l: number[]): number[] => {
  if (shape === 'lshape') {
    const [a, b, c, d] = l;
    return [a, b, c, d, round2(a - c), round2(b + d)];
  }
  return l.slice(0, 4);
};

// Returns the wall lengths after the person sets wall `index` to `value`,
// keeping the walls that depend on it in step.
export const setWallLength = (
  shape: RoomShape,
  lengths: number[],
  index: number,
  value: number,
): number[] => {
  const next = [...lengths];
  if (shape === 'square') {
    return next.map(() => value);
  }
  next[index] = value;
  if (shape === 'rectangle') {
    next[(index + 2) % 4] = value;
  }
  return completeLengths(shape, next);
};

export const roomPoints = (shape: RoomShape, l: number[]): Point[] => {
  if (shape === 'lshape') {
    const [a, b, c, d] = l;
    return [
      {x: 0, y: 0},
      {x: a, y: 0},
      {x: a, y: b},
      {x: a - c, y: b},
      {x: a - c, y: b + d},
      {x: 0, y: b + d},
    ];
  }
  const [a, b] = l;
  return [
    {x: 0, y: 0},
    {x: a, y: 0},
    {x: a, y: b},
    {x: 0, y: b},
  ];
};

// Problem with a wall length, or null if it's fine
export const wallProblem = (
  shape: RoomShape,
  lengths: number[],
  index: number,
): string | null => {
  const value = lengths[index];
  if (!Number.isFinite(value) || value < MIN_WALL) {
    if (shape === 'lshape' && index === 4) {
      return `Wall C must be at least ${MIN_WALL} m shorter than wall A`;
    }
    return `Must be at least ${MIN_WALL} m`;
  }
  if (value > MAX_WALL) {
    return `Must be ${MAX_WALL} m or less`;
  }
  // The L's step (C) can't reach all the way across the top wall (A)
  if (shape === 'lshape' && index === 2 && lengths[0] - value < MIN_WALL) {
    return `Must be at least ${MIN_WALL} m shorter than wall A`;
  }
  return null;
};

export const allWallsValid = (shape: RoomShape, lengths: number[]) =>
  lengths.every((_, i) => wallProblem(shape, lengths, i) === null);

// Which side of the room a wall is on, for the wall picker ("A (Top)")
export const wallSide = (points: Point[], index: number) => {
  const a = points[index];
  const b = points[(index + 1) % points.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'Top' : 'Bottom';
  }
  return dy > 0 ? 'Right' : 'Left';
};

// Problem with placing `opening`, or null if it fits
export const openingProblem = (
  opening: Omit<Opening, 'id'> & {id?: string},
  lengths: number[],
  existing: Opening[],
): string | null => {
  const limits = OPENING_LIMITS[opening.type];
  const label = opening.type === 'door' ? 'Door' : 'Window';
  const wallLength = lengths[opening.wall];
  if (opening.width < limits.min - 1e-6) {
    return `${label} must be at least ${limits.min} m wide`;
  }
  if (opening.offset < -1e-6) {
    return `${label} can't start before the wall does`;
  }
  if (opening.offset + opening.width > wallLength + 1e-6) {
    return `${label} doesn't fit — wall ${wallLetter(opening.wall)} is ${formatMetres(wallLength)} long`;
  }
  const clash = existing.find(
    o =>
      o.id !== opening.id &&
      o.wall === opening.wall &&
      opening.offset < o.offset + o.width - 1e-6 &&
      o.offset < opening.offset + opening.width - 1e-6,
  );
  if (clash) {
    return `${label} overlaps a ${clash.type} already on wall ${wallLetter(opening.wall)}`;
  }
  return null;
};

// A sensible starting position: centred on the wall, to the nearest 10 cm
export const centredOffset = (wallLength: number, width: number) =>
  Math.max(0, Math.round(((wallLength - width) / 2) * 10) / 10);

// What the native RoomBuilderModule needs to build the 3D room
export const buildRoomSpec = (
  shape: RoomShape,
  lengths: number[],
  ceilingHeight: number,
  openings: Opening[],
) => ({
  shape,
  points: roomPoints(shape, lengths),
  ceilingHeight,
  openings: openings.map(o => {
    const isDoor = o.type === 'door';
    const sill = isDoor ? 0 : Math.min(WINDOW_SILL, ceilingHeight - 0.6);
    const height = isDoor
      ? Math.min(DOOR_HEIGHT, ceilingHeight - 0.1)
      : Math.min(WINDOW_HEIGHT, ceilingHeight - sill - 0.2);
    return {type: o.type, wall: o.wall, offset: o.offset, width: o.width, sill, height};
  }),
});

export const round2 = (n: number) => Math.round(n * 100) / 100;

// 3.8 → "3.80 m"; used wherever a length is shown
export const formatMetres = (n: number) => `${n.toFixed(2)} m`;

// 0.9 → "0.9 m", 1.25 → "1.25 m" (no trailing zeros), for widths/positions
export const formatShort = (n: number) => `${round2(n)} m`;

// The builder's answers back from a saved room's spec, so a room can be
// reopened for editing. Wall lengths are the distances between corners.
export const answersFromSpec = (spec: {
  shape?: RoomShape;
  points: Point[];
  ceilingHeight: number;
  openings: {type: OpeningType; wall: number; offset: number; width: number}[];
}) => {
  const {points} = spec;
  const shape: RoomShape =
    spec.shape ?? (points.length === 6 ? 'lshape' : 'rectangle');
  const lengths = points.map((p, i) => {
    const next = points[(i + 1) % points.length];
    return round2(Math.hypot(next.x - p.x, next.y - p.y));
  });
  return {
    shape,
    lengths,
    ceiling: spec.ceilingHeight,
    openings: spec.openings.map((o, i) => ({
      id: `saved-${i}`,
      type: o.type,
      wall: o.wall,
      offset: o.offset,
      width: o.width,
    })),
  };
};
