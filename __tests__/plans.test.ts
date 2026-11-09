import {featureLine, limitMessage, usageLine} from '../src/config/plans';

describe('plan card lines', () => {
  it.each([
    ['room.active', 3, 'atOnce', 'Up to 3 rooms'],
    ['room.active', 1, 'atOnce', 'Up to 1 room'],
    ['design.create', 4, 'lifetime', '4 designs'],
    ['design.create', 10, 'month', '10 designs a month'],
    ['design.create', null, 'month', 'Unlimited designs'],
    ['community.save', 50, 'atOnce', 'Up to 50 saved community designs'],
    ['community.post', 1, 'flag', 'Post your designs to the community'],
    ['export.watermark_free', 1, 'lifetime', '1 export without a watermark'],
    ['export.watermark_free', null, 'lifetime', 'Export without watermarks'],
  ] as const)('%s %s %s → %s', (feature, max, period, text) => {
    expect(featureLine(feature, max, period)).toBe(text);
  });

  it('leaves out features a plan does not have', () => {
    expect(featureLine('community.post', 0, 'flag')).toBeNull();
    expect(featureLine('export.watermark_free', 0, 'lifetime')).toBeNull();
  });
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
