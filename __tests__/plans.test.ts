import {cardLines, limitMessage, usageLine} from '../src/config/plans';

const CASUAL = {
  'room.active': {max: 3},
  'design.create': {max: 4},
  'note.active': {max: 2},
  'community.save': {max: 10},
  'moodboard.active': {max: 3},
  'community.post': {max: 0},
  'export.watermark_free': {max: 1},
};
const HOBBYIST = {
  'room.active': {max: 7},
  'design.create': {max: 10},
  'note.active': {max: 7},
  'community.save': {max: 50},
  'moodboard.active': {max: 10},
  'community.post': {max: 1},
  'export.watermark_free': {max: null},
};

describe('plan card lines', () => {
  it('fills the Casual card from its limits', () => {
    expect(cardLines('casual', CASUAL).map(l => l.title)).toEqual([
      'Add up to 3 rooms',
      'Make up to 4 designs',
      'Keep up to 2 project notes',
      'Create up to 3 mood boards',
      'Save up to 10 community designs',
      'Browse the Community Gallery',
      'Export one design without watermark',
    ]);
  });

  it('fills the Hobbyist card from its limits', () => {
    expect(cardLines('hobbyist', HOBBYIST).map(l => l.title)).toEqual([
      'Add up to 7 rooms in total',
      'Make up to 10 designs each month',
      'Keep up to 7 project notes',
      'Create up to 10 mood boards',
      'Explore designs in 360°',
      'Save up to 50 community designs',
      'Browse the Community Gallery',
      'Generate a shopping list from each design',
      'Priority support',
      'Export without watermarks',
    ]);
  });

  it('follows the server when a limit changes', () => {
    const lines = cardLines('casual', {...CASUAL, 'room.active': {max: 5}});
    expect(lines[0].title).toBe('Add up to 5 rooms');
  });

  it('leaves out a feature limited to 0', () => {
    const titles = cardLines('casual', {
      ...CASUAL,
      'export.watermark_free': {max: 0},
    }).map(l => l.title);
    expect(titles).not.toContain('Export one design without watermark');
  });

  it('marks unbuilt features as coming soon', () => {
    const soon = cardLines('hobbyist', HOBBYIST)
      .filter(l => l.soon)
      .map(l => l.title);
    expect(soon).toEqual([
      'Explore designs in 360°',
      'Generate a shopping list from each design',
    ]);
  });
});

it('has a message for running out of mood boards', () => {
  expect(limitMessage('moodboard.active', {limit: 3}).body).toContain(
    '3 mood boards',
  );
});

describe('usage meters', () => {
  it('reads like "2 of 3 rooms"', () => {
    expect(
      usageLine('room.active', {used: 2, limit: 3, period: 'atOnce', allowed: true}),
    ).toBe('2 of 3 rooms');
    expect(
      usageLine('design.create', {used: 4, limit: 10, period: 'month', allowed: true}),
    ).toBe('4 of 10 designs this month');
  });

  it('shows nothing for unlimited or on/off features', () => {
    expect(
      usageLine('design.create', {used: 4, limit: null, period: 'month', allowed: true}),
    ).toBeNull();
    expect(usageLine('community.post', {used: 0, limit: 0, period: 'flag', allowed: false})).toBeNull();
  });
});

it('has a message for a locked room', () => {
  expect(limitMessage(undefined).title).toBe('Upgrade to open this room');
});
