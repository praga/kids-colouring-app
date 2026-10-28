import { Point } from '../types/colouring';

/**
 * Extracts points from a React PointerEvent including high-frequency coalesced digitizer events.
 * Lenovo Xiaoxin Pad Pro / GT 2025 digitizer reports up to 240Hz-480Hz stylus sampling rates.
 * getCoalescedEvents() captures all sub-frame points to eliminate jagged or polygon edges.
 */
export function extractPointsFromPointerEvent(
  e: React.PointerEvent<HTMLCanvasElement>,
  sessionStartTime: number
): Point[] {
  const rect = e.currentTarget.getBoundingClientRect();
  const nativeEvent = e.nativeEvent as PointerEvent;

  // Check for native digitizer coalesced events
  if (typeof nativeEvent.getCoalescedEvents === 'function') {
    try {
      const coalesced = nativeEvent.getCoalescedEvents();
      if (coalesced && coalesced.length > 0) {
        return coalesced.map((ev) => ({
          x: ev.clientX - rect.left,
          y: ev.clientY - rect.top,
          // Lenovo Xiaoxin Stylus Pen reports pressure in 0.0 - 1.0 (4096 hardware levels)
          p: ev.pressure > 0 ? ev.pressure : 0.65,
          t: Math.max(0, Math.round(performance.now() - sessionStartTime))
        }));
      }
    } catch {
      // Fallback to primary event if coalesced access fails
    }
  }

  return [
    {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      p: e.pressure > 0 ? e.pressure : 0.65,
      t: Math.max(0, Math.round(performance.now() - sessionStartTime))
    }
  ];
}

/**
 * Filters out digitizer lift-off "hooklets".
 * When a child lifts the stylus pen rapidly, digitizers frequently record an erratic tail flick
 * with sharp angle and low pressure. Removing the trailing hook keeps line ends clean.
 */
export function filterLiftOffHooklet(points: Point[]): Point[] {
  if (points.length < 3) return points;

  const pts = [...points];
  const pLast = pts[pts.length - 1];
  const pPrev = pts[pts.length - 2];
  const dist = Math.hypot(pLast.x - pPrev.x, pLast.y - pPrev.y);

  // If final point made a sudden fast leap with very light pressure, drop the artifact
  if (pLast.p < 0.18 && dist > 14) {
    pts.pop();
  }

  return pts;
}

/**
 * Determines whether an incoming pointer event should be rejected based on palm rejection setting.
 * When Palm Rejection is active:
 * - 'pen' is ALWAYS permitted.
 * - 'touch' (finger/palm) is rejected.
 * - 'mouse' is permitted (for desktop development and testing).
 */
export function shouldRejectPointer(
  pointerType: string,
  palmRejectionActive: boolean
): boolean {
  if (!palmRejectionActive) {
    return false;
  }
  return pointerType === 'touch';
}
