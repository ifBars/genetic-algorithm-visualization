export interface PlatformSegment {
  start: number;
  end: number;
  y: number;
}

export interface PlatformerLevel {
  width: number;
  height: number;
  floorY: number;
  fallLimit: number;
  goal: { x: number; y: number; radius: number };
  segments: PlatformSegment[];
}

export interface PlatformerConfig {
  populationSize: number;
  steps: number;
  mutationRate: number;
  mutationStdDev: number;
  crossoverRate: number;
  eliteCount: number;
  dt: number;
  maxSpeed: number;
  maxAccel: number;
  airAccel: number;
  friction: number;
  jumpVelocity: number;
  gravity: number;
  directionCost: number;
  momentumBuildRate: number;
  momentumDecay: number;
  momentumJumpBoost: number;
  momentumMax: number;
  strafeThreshold: number;
}

export interface PlatformerFrame {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  step: number;
}

export interface SimulationResult {
  fitness: number;
  reachedGoal: boolean;
  fell: boolean;
  path: PlatformerFrame[];
  stepsTaken: number;
}

export interface PlatformerIndividual {
  id: string;
  genes: number[];
  fitness: number;
  reachedGoal: boolean;
  fell: boolean;
  path: PlatformerFrame[];
  stepsTaken: number;
}
