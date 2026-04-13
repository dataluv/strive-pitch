"use client";

import { useEffect, useRef } from "react";

export default function ECGLine({
  color = "#10b981",
  height = 60,
  speed = 2,
  className = "",
}: {
  color?: string;
  height?: number;
  speed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = height * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    // ECG-like waveform pattern
    const ecgPattern = [
      0, 0, 0, 0, 0, 0.02, 0.04, 0.02, 0, -0.05, -0.1, -0.05, 0,
      0, 0.05, 0.15, 0.6, 1, 0.6, -0.3, -0.15, 0,
      0, 0.05, 0.1, 0.15, 0.1, 0.05, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
    ];

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;
      const amp = h * 0.35;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const patternLen = ecgPattern.length;
      const step = 8;

      for (let x = 0; x < w; x += step) {
        const idx =
          ((x + Math.floor(offsetRef.current)) % (patternLen * step)) / step;
        const i = Math.floor(idx) % patternLen;
        const frac = idx - Math.floor(idx);
        const v0 = ecgPattern[i];
        const v1 = ecgPattern[(i + 1) % patternLen];
        const val = v0 + (v1 - v0) * frac;
        const y = mid - val * amp;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Sweep dot
      const sweepX = (offsetRef.current * 0.5) % w;
      const sweepIdx =
        ((sweepX + Math.floor(offsetRef.current)) % (patternLen * step)) / step;
      const si = Math.floor(sweepIdx) % patternLen;
      const sf = sweepIdx - Math.floor(sweepIdx);
      const sv = ecgPattern[si] + (ecgPattern[(si + 1) % patternLen] - ecgPattern[si]) * sf;
      const sweepY = mid - sv * amp;

      ctx.beginPath();
      ctx.arc(sweepX, sweepY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowBlur = 15;
      ctx.fill();

      offsetRef.current += speed;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [color, height, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
}
