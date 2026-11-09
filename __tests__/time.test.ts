import {editedAgo, plural} from '../src/utils/time';

describe('editedAgo', () => {
  const now = new Date(2026, 10, 9, 15, 0); // 9 Nov 2026, 3pm

  it.each([
    [new Date(2026, 10, 9, 8, 0), 'Edited today'],
    [new Date(2026, 10, 8, 23, 0), 'Edited yesterday'],
    [new Date(2026, 10, 6, 12, 0), 'Edited 3 days ago'],
    [new Date(2026, 9, 12, 12, 0), 'Edited 12 Oct'],
    [new Date(2025, 9, 12, 12, 0), 'Edited 12 Oct 2025'],
  ])('%s → %s', (date, text) => {
    expect(editedAgo(date.toISOString(), now)).toBe(text);
  });
});

it('pluralises counts', () => {
  expect(plural(1, 'room')).toBe('1 room');
  expect(plural(3, 'room')).toBe('3 rooms');
});
