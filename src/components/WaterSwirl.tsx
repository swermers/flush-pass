'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onComplete: () => void;
}

interface Particle {
  angle: number;
  radius: number;
  angVel: number;
  radVel: number;
  opacity: number;
  size: number;
}

const SPIN_UP_MS = 600;
const SPIN_DOWN_MS = 600;

export default function WaterSwirl({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.48;

    const sustainedMs = 2000 + Math.random() * 1500;
    const totalMs = SPIN_UP_MS + sustainedMs + SPIN_DOWN_MS;
    const direction = Math.random() < 0.9 ? 1 : -1;
    const baseSpeed = (0.09 + Math.random() * 0.018) * direction;
    const particleCount = 30 + Math.floor(Math.random() * 21);

    const particles: Particle[] = [];
    function spawn(p?: Particle) {
      const part: Particle = p ?? {
        angle: 0,
        radius: 0,
        angVel: 0,
        radVel: 0,
        opacity: 0,
        size: 0,
      };
      part.angle = Math.random() * Math.PI * 2;
      part.radius = maxR * (0.7 + Math.random() * 0.3);
      part.angVel = baseSpeed * (0.8 + Math.random() * 0.4);
      part.radVel = -(0.2 + Math.random() * 0.4);
      part.opacity = 0.4 + Math.random() * 0.4;
      part.size = 1 + Math.random() * 2;
      return part;
    }
    for (let i = 0; i < particleCount; i++) particles.push(spawn());

    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const elapsed = now - start;
      let phase: 'up' | 'sustain' | 'down';
      let intensity: number;
      if (elapsed < SPIN_UP_MS) {
        phase = 'up';
        intensity = elapsed / SPIN_UP_MS;
      } else if (elapsed < SPIN_UP_MS + sustainedMs) {
        phase = 'sustain';
        const localT = (elapsed - SPIN_UP_MS) / sustainedMs;
        intensity = 1 + Math.sin(localT * Math.PI * 4) * 0.05;
      } else {
        phase = 'down';
        const t = (elapsed - SPIN_UP_MS - sustainedMs) / SPIN_DOWN_MS;
        intensity = Math.max(0, 1 - t);
      }

      ctx.clearRect(0, 0, w, h);

      // Vortex darkening
      const vortex = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      vortex.addColorStop(0, `rgba(0, 0, 0, ${0.55 * intensity})`);
      vortex.addColorStop(0.6, `rgba(0, 0, 0, ${0.18 * intensity})`);
      vortex.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = vortex;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Subtle spiraling streaks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1;
      const armCount = 5;
      for (let i = 0; i < armCount; i++) {
        const t = elapsed * 0.0015 * direction + (i * Math.PI * 2) / armCount;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * intensity})`;
        ctx.beginPath();
        for (let r = 4; r < maxR; r += 4) {
          const a = t + r * 0.045 * direction;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (r === 4) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Particles
      for (const p of particles) {
        p.angle += p.angVel * intensity;
        p.radius += p.radVel * intensity;
        if (p.radius < 6 || p.opacity < 0.05) {
          if (phase !== 'down') spawn(p);
          else p.opacity = Math.max(0, p.opacity - 0.02);
        }
        if (phase === 'down') {
          p.opacity = Math.max(0, p.opacity - 0.012);
        }
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius;
        ctx.fillStyle = `rgba(240, 245, 250, ${p.opacity * intensity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (elapsed >= totalMs) {
        if (!finished.current) {
          finished.current = true;
          onComplete();
        }
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="h-full w-full"
      style={{ borderRadius: '50%' }}
    />
  );
}
