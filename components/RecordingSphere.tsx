'use client';

import { useEffect, useRef } from 'react';

interface Props {
  stream: MediaStream | null;
  size?: number;
}

const POINT_COUNT = 96;

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

export default function RecordingSphere({ stream, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream) return;
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

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const points = fibonacciSphere(POINT_COUNT);
    let raf = 0;
    let smoothedAvg = 0;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      smoothedAvg = smoothedAvg * 0.78 + avg * 0.22;

      ctx2d.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseR = size * 0.3;
      const r = baseR * (1 + smoothedAvg * 0.35);

      const tNow = performance.now() * 0.00028;
      const cosT = Math.cos(tNow);
      const sinT = Math.sin(tNow);
      const cosA = Math.cos(tNow * 0.6);
      const sinA = Math.sin(tNow * 0.6);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        let x = p.x * cosT - p.z * sinT;
        let z = p.x * sinT + p.z * cosT;
        let y = p.y;
        const yy = y * cosA - z * sinA;
        const zz = y * sinA + z * cosA;
        y = yy;
        z = zz;

        const bin = data[i % data.length] / 255;
        const wobble = (Math.sin(tNow * 6 + i * 0.7) * 0.5 + 0.5) * bin * 6;

        const px = cx + x * (r + wobble);
        const py = cy + y * (r + wobble);
        const depth = (z + 1) / 2;
        const dotR = 0.9 + depth * 1.7;
        const alpha = 0.18 + depth * 0.62;

        ctx2d.fillStyle = `rgba(196, 163, 90, ${alpha.toFixed(3)})`;
        ctx2d.beginPath();
        ctx2d.arc(px, py, dotR, 0, Math.PI * 2);
        ctx2d.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void audioCtx.close();
    };
  }, [stream, size]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
