import { clamp } from '../utils/math';
import { resolveCollisions } from './level';
import type { PlatformerConfig, PlatformerLevel, PlatformerFrame, SimulationResult } from './types';

export const simulateIndividual = (
  genes: number[],
  config: PlatformerConfig,
  level: PlatformerLevel,
): SimulationResult => {
  let x = 0;
  let y = level.floorY;
  let vx = 0;
  let vy = 0;
  let grounded = true;
  let reachedGoal = false;
  let fell = false;
  let directionPenaltyTotal = 0;
  let momentumCharge = 0;
  let lastStrafeDir = 0;

  const path: PlatformerFrame[] = [
    { x, y, vx, vy, grounded, step: 0 },
  ];

  for (let step = 0; step < config.steps; step += 1) {
    const horizontalGene = clamp(genes[step * 2] ?? 0, -1, 1);
    const jumpGene = clamp(genes[step * 2 + 1] ?? -1, -1, 1);
    const strafeInput = Math.abs(horizontalGene) >= config.strafeThreshold ? Math.sign(horizontalGene) : 0;

    const accelCap = grounded ? config.maxAccel : config.airAccel;
    const ax = horizontalGene * accelCap;
    const prevVx = vx;
    let nextVx = prevVx + ax * config.dt;
    const frictionFactor = grounded ? config.friction : Math.min(1, config.friction + 0.05);
    nextVx *= frictionFactor;
    nextVx = clamp(nextVx, -config.maxSpeed, config.maxSpeed);
    vx = nextVx;
    const deltaV = Math.abs(vx - prevVx);
    directionPenaltyTotal += deltaV;

    if (grounded) {
      momentumCharge = Math.max(0, momentumCharge - config.momentumDecay * config.dt);
      const movingEnough = Math.abs(prevVx) > 0.25 || Math.abs(ax) > 0.25;
      if (strafeInput !== 0 && movingEnough) {
        if (lastStrafeDir !== 0 && strafeInput !== lastStrafeDir) {
          momentumCharge = Math.min(
            config.momentumMax,
            momentumCharge + config.momentumBuildRate,
          );
        }
        lastStrafeDir = strafeInput;
      } else if (strafeInput === 0) {
        lastStrafeDir = 0;
      }
    } else {
      momentumCharge = Math.max(0, momentumCharge - config.momentumDecay * config.dt * 1.35);
    }

    if (grounded && jumpGene > 0.5) {
      const momentumBonus = Math.min(config.momentumMax, momentumCharge) * config.momentumJumpBoost;
      vy = config.jumpVelocity + momentumBonus;
      momentumCharge = 0;
      grounded = false;
      lastStrafeDir = 0;
    }

    vy -= config.gravity * config.dt;

    const prevX = x;
    const prevY = y;
    const nextX = x + vx * config.dt;
    const nextY = y + vy * config.dt;

    const resolved = resolveCollisions(prevX, prevY, nextX, nextY, vy, level);
    x = resolved.x;
    y = resolved.y;
    vy = resolved.vy;
    grounded = resolved.grounded;
    if (resolved.hitWall) {
      vx = 0;
      momentumCharge = Math.max(0, momentumCharge - config.momentumBuildRate * 0.5);
    }

    if (y < level.fallLimit) {
      fell = true;
      path.push({ x, y, vx, vy, grounded: false, step: step + 1 });
      break;
    }

    if (x >= level.goal.x && Math.abs(y - level.goal.y) <= level.goal.radius) {
      reachedGoal = true;
      path.push({ x, y, vx, vy, grounded, step: step + 1 });
      break;
    }

    path.push({ x, y, vx, vy, grounded, step: step + 1 });
  }

  const stepsTaken = path.length - 1;
  const horizontalProgress = Math.min(level.goal.x, Math.max(0, x));
  const progressScore = (horizontalProgress / level.goal.x) * 100;
  const heightBonus = Math.max(0, Math.min(level.goal.y + 6, y)) * 1.5;
  const strafePenalty = directionPenaltyTotal * config.directionCost;
  let fitness = progressScore + heightBonus - stepsTaken * 0.05 - strafePenalty;

  if (reachedGoal) {
    fitness += 120;
    fitness += Math.max(0, config.steps - stepsTaken) * 0.4;
  }

  if (fell) {
    fitness -= 40;
  }

  if (!Number.isFinite(fitness)) {
    fitness = -100;
  }

  return {
    fitness,
    reachedGoal,
    fell,
    path,
    stepsTaken,
  };
};
