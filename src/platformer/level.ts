import type { PlatformerLevel } from './types';

export const defaultLevel: PlatformerLevel = {
  width: 120,
  height: 32,
  floorY: 0,
  fallLimit: -12,
  goal: { x: 110, y: -2, radius: 1 },
  segments: [
    { start: -5, end: 30, y: 0 },
    { start: 34, end: 60, y: 0 },
    { start: 64, end: 82, y: -1 },
    { start: 86, end: 94, y: 0 },
    { start: 103, end: 120, y: -2 },
  ],
};

export const levelObstacles = {
  gaps: [
    { start: 30, end: 34 },
    { start: 60, end: 64 },
    { start: 94, end: 113 },
  ],
};

// --- Collision helpers ---

export const getSupportingSegment = (x: number, level: PlatformerLevel) =>
  level.segments.find((segment) => x >= segment.start && x <= segment.end) ?? null;

/**
 * Resolves simple platformer collisions against flat segments with step-up blocking.
 * - One-way platforms from above (you can fall off edges and pass beneath).
 * - Prevents horizontal tunneling into a higher platform edge (treats it like a wall).
 */
export const resolveCollisions = (
  prevX: number,
  prevY: number,
  nextX: number,
  nextY: number,
  vy: number,
  level: PlatformerLevel,
) => {
  const eps = 1e-3;
  let x = nextX;
  let y = nextY;
  let grounded = false;
  let newVy = vy;
  let hitWall = false;

  const prevSupport = getSupportingSegment(prevX, level);
  const nextSupport = getSupportingSegment(nextX, level);

  // Vertical landing onto a platform if crossing from above
  if (nextSupport) {
    const sy = nextSupport.y;
    if (prevY >= sy && nextY <= sy) {
      y = sy;
      newVy = 0;
      grounded = true;
    } else if (y < sy - 0.01) {
      grounded = false;
    }
  }

  // Step-up blocking: prevent moving horizontally into a higher platform from below
  if (nextSupport && y < nextSupport.y - eps) {
    const movingRight = nextX > prevX + eps;
    const movingLeft = nextX < prevX - eps;
    if (movingRight && prevX < nextSupport.start && nextX >= nextSupport.start) {
      // Entering the platform interval from the left while below its surface
      x = nextSupport.start - eps;
      hitWall = true;
    } else if (movingLeft && prevX > nextSupport.end && nextX <= nextSupport.end) {
      // Entering from the right while below its surface
      x = nextSupport.end + eps;
      hitWall = true;
    } else if (prevSupport && prevSupport !== nextSupport && nextSupport.y > Math.min(prevY, y) + eps) {
      // Changing segment onto a higher surface horizontally; clamp to boundary
      if (movingRight) {
        x = (nextSupport.start ?? x) - eps;
      } else if (movingLeft) {
        x = (nextSupport.end ?? x) + eps;
      }
      hitWall = true;
    }
  }

  return { x, y, vy: newVy, grounded, hitWall } as const;
};
