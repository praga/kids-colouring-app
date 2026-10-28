import { describe, it, expect } from 'vitest';
import { shouldRejectPointer, filterLiftOffHooklet } from '../src/utils/palmRejection';
import { Point } from '../src/types/colouring';

describe('Palm Rejection Engine', () => {
  it('rejects touch (finger/palm) when palm rejection is active', () => {
    expect(shouldRejectPointer('touch', true)).toBe(true);
  });

  it('permits touch when palm rejection is disabled (finger-painting mode)', () => {
    expect(shouldRejectPointer('touch', false)).toBe(false);
  });

  it('ALWAYS permits stylus pen events regardless of palm rejection state', () => {
    expect(shouldRejectPointer('pen', true)).toBe(false);
    expect(shouldRejectPointer('pen', false)).toBe(false);
  });

  it('permits desktop mouse events for testing', () => {
    expect(shouldRejectPointer('mouse', true)).toBe(false);
    expect(shouldRejectPointer('mouse', false)).toBe(false);
  });

  it('filters out trailing lift-off hooklet with low pressure and abrupt distance jump', () => {
    const points: Point[] = [
      { x: 100, y: 100, p: 0.7, t: 10 },
      { x: 105, y: 105, p: 0.65, t: 20 },
      { x: 110, y: 110, p: 0.6, t: 30 },
      { x: 135, y: 135, p: 0.05, t: 40 } // Hooklet: low pressure (0.05 < 0.18) & distance ~35px > 14px
    ];

    const cleaned = filterLiftOffHooklet(points);
    expect(cleaned.length).toBe(3);
    expect(cleaned[cleaned.length - 1].x).toBe(110);
  });

  it('preserves legitimate ending points with normal pressure', () => {
    const points: Point[] = [
      { x: 100, y: 100, p: 0.7, t: 10 },
      { x: 105, y: 105, p: 0.65, t: 20 },
      { x: 110, y: 110, p: 0.5, t: 30 }
    ];

    const cleaned = filterLiftOffHooklet(points);
    expect(cleaned.length).toBe(3);
  });
});
