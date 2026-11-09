import {
  Opening,
  RoomShape,
  answersFromSpec,
  buildRoomSpec,
  defaultLengths,
} from '../src/screens/room_builder/roomGeometry';

// Editing a saved room reopens the builder from its spec, so the answers
// must come back exactly as they were entered.
describe('answersFromSpec', () => {
  const openings: Opening[] = [
    {id: 'a', type: 'door', wall: 0, offset: 0.5, width: 0.9},
    {id: 'b', type: 'window', wall: 2, offset: 1, width: 1.2},
  ];

  it.each<[RoomShape, number[]]>([
    ['rectangle', [4.2, 3.1, 4.2, 3.1]],
    ['square', [3.5, 3.5, 3.5, 3.5]],
    ['lshape', defaultLengths('lshape')],
  ])('round-trips a %s room', (shape, lengths) => {
    const spec = buildRoomSpec(shape, lengths, 2.6, openings);
    const answers = answersFromSpec(spec);
    expect(answers.shape).toBe(shape);
    expect(answers.lengths).toEqual(lengths);
    expect(answers.ceiling).toBe(2.6);
    expect(
      answers.openings.map(({type, wall, offset, width}) => ({
        type,
        wall,
        offset,
        width,
      })),
    ).toEqual(openings.map(({id: _id, ...rest}) => rest));
  });

  it('guesses the shape for a spec saved without one', () => {
    const {shape: _shape, ...spec} = buildRoomSpec(
      'lshape',
      defaultLengths('lshape'),
      2.4,
      [],
    );
    expect(answersFromSpec(spec).shape).toBe('lshape');
  });
});
