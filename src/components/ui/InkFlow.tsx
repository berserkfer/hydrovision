"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Textura de corrientes de agua — puramente decorativa (aria-hidden), no representa datos.
 * Las líneas siguen un cauce sinuoso que desemboca en un punto de descarga, y un hilo fino
 * baja desde arriba hasta ese punto: el dren entrando a la corriente. Determinista por semilla
 * para que no "salte" entre renders.
 */

interface InkFlowProps {
  className?: string;
  seed?: number;
  /** Densidad relativa de líneas (1 = héroe). */
  density?: number;
  /** Posición del punto de descarga en fracción del lienzo; null para omitirlo. */
  outlet?: { x: number; y: number } | null;
  /** Dibuja el hilo del dren que baja hasta el punto. */
  drain?: boolean;
  /** Color de tinta; por defecto toma --hv-ink del tema. */
  ink?: string;
  /** Opacidad global. */
  strength?: number;
  animate?: boolean;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number, x: number, y: number) => {
    const g = h & 7;
    const u = g < 4 ? x : y;
    const v = g < 4 ? y : x;
    return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v);
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    ) / 2;
  };
}

interface Stroke {
  pts: number[];
  alpha: number;
  width: number;
}

function buildStrokes(
  w: number,
  h: number,
  seed: number,
  density: number,
  outlet: { x: number; y: number } | null,
  drain: boolean
): Stroke[] {
  const rand = mulberry32(seed * 7919 + 13);
  const noise = makeNoise(seed);
  const scale = Math.max(w, h);

  // Cauce principal: entra por la izquierda baja, serpentea y sube hacia el punto de descarga.
  const ox = (outlet?.x ?? 0.82) * w;
  const oy = (outlet?.y ?? 0.42) * h;
  const center = (x: number) => {
    const t = x / w;
    const base = h * (0.95 - 0.5 * t) + Math.sin(t * Math.PI * 1.8 + 0.3) * h * 0.12;
    // se curva hacia el punto de descarga cerca de él
    const pull = Math.exp(-((x - ox) ** 2) / (2 * (w * 0.14) ** 2));
    return base * (1 - pull) + oy * pull;
  };

  const field = (x: number, y: number) => {
    const dx = 2;
    const slope = (center(x + dx) - center(x - dx)) / (2 * dx);
    const along = Math.atan(slope);
    const dist = (y - center(x)) / h;
    const spread = Math.min(1, Math.abs(dist) * 2.6);
    const n = noise(x / (scale * 0.22), y / (scale * 0.22));
    const n2 = noise(x / (scale * 0.07) + 31, y / (scale * 0.07) - 17);
    // cerca del cauce: laminar; lejos: más remolino
    let ang = along - dist * 0.9 + n * (0.6 + spread * 2.6) + n2 * 0.35 * spread;
    if (outlet) {
      // remolino alrededor del punto de descarga
      const rx = x - ox;
      const ry = y - oy;
      const r = Math.hypot(rx, ry);
      const swirl = Math.exp(-(r * r) / (2 * (scale * 0.07) ** 2));
      ang = ang * (1 - swirl) + (Math.atan2(ry, rx) + Math.PI / 2 + 0.35) * swirl;
    }
    return ang;
  };

  const strokes: Stroke[] = [];
  const count = Math.round(680 * density);
  const step = Math.max(1.4, scale / 420);
  const steps = Math.round((scale * 1.25) / step);
  const sinkR = Math.max(6, Math.min(w, h) * 0.05);

  for (let i = 0; i < count; i++) {
    // Tres poblaciones: núcleo del cauce (tinta densa), orillas, y agua abierta (filamentos).
    const r = rand();
    // El cauce y sus orillas nacen aguas arriba del punto de descarga; aguas abajo solo
    // quedan filamentos de agua abierta.
    const upstream = outlet ? ox + w * 0.04 : w;
    const sx = r < 0.58 ? rand() * (upstream + w * 0.15) - w * 0.15 : rand() * w * 1.15 - w * 0.15;
    const cx = center(Math.max(0, sx));
    const sy =
      r < 0.26
        ? cx + (rand() - 0.5) * h * 0.12
        : r < 0.58
          ? cx + (rand() - 0.5) * h * 0.42
          : rand() * h;
    const d = Math.abs(sy - cx) / h;
    const core = Math.exp(-(d * d) / 0.0035);
    // variación por línea: vetas oscuras y claras dentro del mismo cauce, como tinta marmolada
    const vein = rand() < 0.3 ? 1 : 0.45;
    const alpha = 0.05 + 0.36 * core * vein + 0.1 * Math.exp(-(d * d) / 0.03) + rand() * 0.05;
    const width = 0.3 + rand() * 0.55 + core * vein * rand() * 1.1;
    const pts: number[] = [];
    let x = sx;
    let y = sy;
    // las líneas del cauce se deshilachan poco después de la descarga
    const reach = outlet ? ox + w * (0.01 + rand() * 0.07) : Infinity;
    for (let s = 0; s < steps; s++) {
      pts.push(x, y);
      const a = field(x, y);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) break;
      // el punto de descarga actúa como sumidero: la corriente entra y no sigue de largo
      if (outlet && Math.hypot(x - ox, y - oy) < sinkR) break;
      // cualquier línea que vaya por el cauce más allá de la descarga se corta (aguas abiertas siguen)
      if (x > reach && (r < 0.58 || Math.abs(y - center(Math.min(x, w))) < h * 0.12)) break;
    }
    if (pts.length > 8) strokes.push({ pts, alpha, width });
  }

  if (drain && outlet) {
    // Hilo del dren: camino irregular que baja desde arriba hasta el punto de descarga.
    for (let k = 0; k < 2; k++) {
      const pts: number[] = [];
      let x = ox - w * 0.12 + k * w * 0.05;
      let y = -4;
      while (y < oy - 6) {
        pts.push(x, y);
        const tx = ox - x;
        const ty = oy - y;
        const len = Math.hypot(tx, ty) || 1;
        const jitter = (rand() - 0.5) * 2.6;
        x += (tx / len) * 2.2 + jitter;
        y += (ty / len) * 2.2 + Math.abs(jitter) * 0.2;
      }
      pts.push(ox, oy);
      strokes.push({ pts, alpha: k === 0 ? 0.75 : 0.25, width: k === 0 ? 1.1 : 0.6 });
    }
  }

  return strokes;
}

function resolveInk(el: HTMLElement, ink?: string) {
  if (ink) return ink;
  const v = getComputedStyle(el).getPropertyValue("--hv-ink").trim();
  return v || "#0f2347";
}

export function InkFlow({
  className,
  seed = 4000,
  density = 1,
  outlet = { x: 0.82, y: 0.42 },
  drain = true,
  ink,
  strength = 1,
  animate = true,
}: InkFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;

    const draw = () => {
      cancelAnimationFrame(raf);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const color = resolveInk(canvas, ink);
      const strokes = buildStrokes(rect.width, rect.height, seed, density, outlet, drain);
      const reduce =
        !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const paintOutlet = () => {
        if (!outlet) return;
        const ox = outlet.x * rect.width;
        const oy = outlet.y * rect.height;
        const r = Math.max(5, Math.min(rect.width, rect.height) * 0.045);
        ctx.globalAlpha = 0.18 * strength;
        ctx.strokeStyle = color;
        for (let i = 1; i <= 3; i++) {
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.ellipse(ox, oy, r * (1 + i * 0.45), r * (0.72 + i * 0.32), -0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.92 * strength;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(ox, oy, r, r * 0.74, -0.2, 0, Math.PI * 2);
        ctx.fill();
      };

      const paint = (progress: number) => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const s of strokes) {
          const n = Math.max(2, Math.floor((s.pts.length / 2) * progress));
          ctx.globalAlpha = s.alpha * strength;
          ctx.lineWidth = s.width;
          ctx.beginPath();
          ctx.moveTo(s.pts[0], s.pts[1]);
          for (let i = 1; i < n; i++) ctx.lineTo(s.pts[i * 2], s.pts[i * 2 + 1]);
          ctx.stroke();
        }
        if (progress >= 1) paintOutlet();
        ctx.globalAlpha = 1;
      };

      if (reduce) {
        paint(1);
        return;
      }
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out: la tinta corre rápido y se asienta
        paint(1 - Math.pow(1 - t, 3));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    draw();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    ro.observe(canvas);
    // El tema cambia el color de la tinta
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
    // outlet es un objeto literal; se serializa para no redibujar en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, density, drain, ink, strength, animate, outlet?.x, outlet?.y]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
