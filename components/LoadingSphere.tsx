'use client';

import { useEffect, useRef } from 'react';

interface Props {
  size?: number;
  pointCount?: number;
}

function fibonacciSphere(n: number) {
  const points: { x: number; y: number; z: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return points;
}

export default function LoadingSphere({ size = 24, pointCount = 64 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx2d.scale(dpr, dpr);

    const points = fibonacciSphere(pointCount);
    let raf = 0;

    const draw = () => {
      ctx2d.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseR = size * 0.32;
      const tNow = performance.now() * 0.0006;
      const breath = (Math.sin(tNow * 1.4) * 0.5 + 0.5) * 0.15;
      const r = baseR * (1 + breath);

      const cosT = Math.cos(tNow);
      const sinT = Math.sin(tNow);
      const cosA = Math.cos(tNow * 0.6);
      const sinA = Math.sin(tNow * 0.6);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const x = p.x * cosT - p.z * sinT;
        const z0 = p.x * sinT + p.z * cosT;
        const y = p.y * cosA - z0 * sinA;
        const z = p.y * sinA + z0 * cosA;

        const wobble = Math.sin(tNow * 4 + i * 0.7) * 0.6;
        const px = cx + x * (r + wobble);
        const py = cy + y * (r + wobble);
        const depth = (z + 1) / 2;
        const dotR = Math.max(0.4, 0.35 + depth * 0.9);
        const alpha = 0.25 + depth * 0.7;

        ctx2d.fillStyle = `rgba(245, 241, 234, ${alpha.toFixed(3)})`;
        ctx2d.beginPath();
        ctx2d.arc(px, py, dotR, 0, Math.PI * 2);
        ctx2d.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [size, pointCount]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
