import { useEffect, useMemo, useRef, useState } from 'react';

import type { PlatformerConfig, PlatformerFrame, PlatformerLevel } from '../../platformer/types';

interface PlatformerCanvasProps {
  level: PlatformerLevel;
  config: PlatformerConfig;
  path: PlatformerFrame[];
  running: boolean;
  generation: number;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 360;

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0b1321');
  gradient.addColorStop(1, '#05070f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

const usePlayback = (path: PlatformerFrame[], config: PlatformerConfig, running: boolean, generation: number) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const stepDurationMs = config.dt * 1000;

  useEffect(() => {
    setFrameIndex(0);
  }, [path, generation]);

  useEffect(() => {
    if (path.length === 0) return undefined;

    let cancelled = false;
    const tick = (timestamp: number) => {
      if (cancelled) return;
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      if (delta >= stepDurationMs) {
        lastTimeRef.current = timestamp;
        setFrameIndex((current) => Math.min(current + 1, path.length - 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [path, running, stepDurationMs, generation]);

  return frameIndex;
};

export const PlatformerCanvas = ({ level, path, config, running, generation }: PlatformerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIndex = usePlayback(path, config, running, generation);
  const targetFrame = useMemo(() => {
    if (!path.length) return undefined;
    const index = Math.min(frameIndex, path.length - 1);
    return path[index];
  }, [frameIndex, path]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);

    const margin = 40;
    const drawWidth = CANVAS_WIDTH - margin * 2;
    const drawHeight = CANVAS_HEIGHT - margin * 2;
    const verticalSpan = level.height - level.fallLimit;
    const toCanvasX = (value: number) => margin + (value / level.width) * drawWidth;
    const toCanvasY = (value: number) =>
      margin + drawHeight - ((value - level.fallLimit) / verticalSpan) * drawHeight;

    // Draw level segments
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    level.segments.forEach((segment) => {
      const startX = toCanvasX(segment.start);
      const endX = toCanvasX(segment.end);
      const y = toCanvasY(segment.y);
      const bottom = toCanvasY(level.fallLimit);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(startX, y, endX - startX, bottom - y + 6);
      ctx.strokeStyle = '#111827';
      ctx.strokeRect(startX, y, endX - startX, bottom - y + 6);
    });

    // Draw goal
    const goalX = toCanvasX(level.goal.x);
    const goalY = toCanvasY(level.goal.y);
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(goalX, goalY);
    ctx.lineTo(goalX, goalY - 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(goalX, goalY - 60);
    ctx.lineTo(goalX + 24, goalY - 50);
    ctx.lineTo(goalX, goalY - 40);
    ctx.closePath();
    ctx.fill();

    // Draw path trail
    if (path.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59,130,246,0.45)';
      ctx.lineWidth = 3;
      const clampedPath = path.slice(0, Math.min(frameIndex + 1, path.length));
      clampedPath.forEach((frame, index) => {
        const px = toCanvasX(frame.x);
        const py = toCanvasY(frame.y + 0.4);
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
    }

    // Draw agent
    if (targetFrame) {
      const agentX = toCanvasX(targetFrame.x);
      const agentY = toCanvasY(targetFrame.y + 0.5);
      ctx.beginPath();
      ctx.fillStyle = targetFrame.grounded ? '#34d399' : '#60a5fa';
      ctx.arc(agentX, agentY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [path, frameIndex, level, targetFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="h-full w-full rounded-xl border border-panel-border bg-slate-950 shadow-inner"
    />
  );
};
