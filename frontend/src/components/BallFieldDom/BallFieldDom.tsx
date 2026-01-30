import { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import styles from "./BallFieldDom.module.css";

type Mode = "cluster" | "scatter";

type Ball = {
  id: string;

  // base radius in px (before depth scale)
  r: number;

  // normalized position 0..1 (screen space)
  x: number;
  y: number;

  // depth in [-1, 1], controls scale and brightness
  z: number;

  // normalized velocity
  vx: number;
  vy: number;

  // depth velocity
  vz: number;

  baseOpacity: number;
  colorClass: string;

  active: boolean;
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function normalize(dx: number, dy: number) {
  const mag = Math.hypot(dx, dy) || 1;
  return { nx: dx / mag, ny: dy / mag, mag };
}

export default function BallFieldDom({ scatter }: { scatter: boolean }) {
  const reduced = usePrefersReducedMotion();

  const layerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const ballsRef = useRef<Ball[]>([]);
  const modeRef = useRef<Mode>("cluster");

  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);

  // Tunables
  const COUNT = 40;

  // Bigger balls
  const R_MIN = 18;
  const R_MAX = 36;

  // Where the cluster sits
  const CENTER_X = 0.5;
  const CENTER_Y = 0.45;

  // Gravity toward center (cluster)
  const GRAVITY = 0.06;

  // Damping so it does not jitter forever
  const DAMPING = 0.988;

  // Depth spring so balls form a thick "sphere", not a flat disk
  const Z_SPRING = 0.03;
  const Z_DAMPING = 0.965;

  // Keep cluster contained in a circular area
  const CLUSTER_RADIUS = 0.23;

  // Scatter (slower cinematic)
  const SCATTER_KICK_MIN = 0.009;
  const SCATTER_KICK_MAX = 0.022;
  const SCATTER_ACCEL = 1.005;
  const MAX_SPEED = 0.045;

  // Offscreen kill switch, prevents lag and prevents page expansion issues
  const OFFSCREEN_PADDING_PX = 180;

  // Visual depth settings
  const Z_PX = 320; // how much translateZ to apply
  const Z_SCALE = 0.7; // how much scale is affected by z
  const Z_OPACITY = 0.35; // how much opacity is affected by z

  const initial = useMemo(() => {
    const colors = ["ballGold", "ballPurple", "ballNeutral1", "ballNeutral2"];

    return Array.from({ length: COUNT }).map((_, i) => {
      const r = rand(R_MIN, R_MAX);

      // Start in a disk near center
      const angle = rand(0, Math.PI * 2);
      const radius = rand(0, CLUSTER_RADIUS * 0.75);

      const x = clamp(CENTER_X + Math.cos(angle) * radius, 0.05, 0.95);
      const y = clamp(CENTER_Y + Math.sin(angle) * radius, 0.05, 0.95);

      const z = rand(-0.7, 0.7);

      return {
        id: `ball-${i}`,
        r,
        x,
        y,
        z,
        vx: rand(-0.003, 0.003),
        vy: rand(-0.003, 0.003),
        vz: rand(-0.002, 0.002),
        baseOpacity: rand(0.65, 0.95),
        colorClass: colors[i % colors.length],
        active: true,
      } as Ball;
    });
  }, []);

  useEffect(() => {
    ballsRef.current = initial;
  }, [initial]);

  const respawnAll = () => {
    const balls = ballsRef.current;
    for (const b of balls) {
      b.active = true;

      const angle = rand(0, Math.PI * 2);
      const radius = rand(0, CLUSTER_RADIUS * 0.75);

      b.x = clamp(CENTER_X + Math.cos(angle) * radius, 0.05, 0.95);
      b.y = clamp(CENTER_Y + Math.sin(angle) * radius, 0.05, 0.95);

      b.z = rand(-0.7, 0.7);

      b.vx = rand(-0.003, 0.003);
      b.vy = rand(-0.003, 0.003);
      b.vz = rand(-0.002, 0.002);

      const node = nodesRef.current.get(b.id);
      if (node) node.style.display = "block";
    }
  };

  // Elastic collision between two balls in pixel space (2D collision)
  const resolveCollision2D = (a: Ball, b: Ball, w: number, h: number) => {
    // Convert normalized to pixel centers
    const ax = a.x * w;
    const ay = a.y * h;
    const bx = b.x * w;
    const by = b.y * h;

    const dx = bx - ax;
    const dy = by - ay;

    const dist = Math.hypot(dx, dy);
    if (dist === 0) return;

    // Effective radius with depth scaling, closer balls look bigger and collide sooner
    const aScale = 1 + a.z * Z_SCALE;
    const bScale = 1 + b.z * Z_SCALE;
    const ar = a.r * aScale;
    const br = b.r * bScale;

    const minDist = ar + br;
    if (dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;

    // Separate overlap (mass proportional to area)
    const overlap = minDist - dist;
    const massA = ar * ar;
    const massB = br * br;
    const invMassA = 1 / massA;
    const invMassB = 1 / massB;
    const invMassSum = invMassA + invMassB;

    const axNew = ax - nx * overlap * (invMassA / invMassSum);
    const ayNew = ay - ny * overlap * (invMassA / invMassSum);
    const bxNew = bx + nx * overlap * (invMassB / invMassSum);
    const byNew = by + ny * overlap * (invMassB / invMassSum);

    a.x = axNew / w;
    a.y = ayNew / h;
    b.x = bxNew / w;
    b.y = byNew / h;

    // Velocities in pixels for impulse math
    const avx = a.vx * w;
    const avy = a.vy * h;
    const bvx = b.vx * w;
    const bvy = b.vy * h;

    const rvx = bvx - avx;
    const rvy = bvy - avy;
    const velAlongNormal = rvx * nx + rvy * ny;

    // If already separating, skip impulse
    if (velAlongNormal > 0) return;

    const restitution = 0.92;

    const j = (-(1 + restitution) * velAlongNormal) / (invMassA + invMassB);
    const impulseX = j * nx;
    const impulseY = j * ny;

    const avx2 = avx - impulseX * invMassA;
    const avy2 = avy - impulseY * invMassA;
    const bvx2 = bvx + impulseX * invMassB;
    const bvy2 = bvy + impulseY * invMassB;

    // Back to normalized
    a.vx = avx2 / w;
    a.vy = avy2 / h;
    b.vx = bvx2 / w;
    b.vy = bvy2 / h;
  };

  // Apply initial styles once nodes mount
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const rect = layer.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    for (const b of ballsRef.current) {
      const node = nodesRef.current.get(b.id);
      if (!node) continue;

      const depthScale = clamp(1 + b.z * Z_SCALE, 0.55, 1.65);
      const px = b.x * w;
      const py = b.y * h;

      node.style.width = `${b.r * 2}px`;
      node.style.height = `${b.r * 2}px`;

      node.style.transform = `translate3d(${px - b.r}px, ${py - b.r}px, ${b.z * Z_PX}px) scale(${depthScale})`;
      node.style.opacity = `${clamp(b.baseOpacity * (1 + b.z * Z_OPACITY), 0.15, 1)}`;
    }
  }, []);

  // Switch modes
  useEffect(() => {
    modeRef.current = scatter ? "scatter" : "cluster";

    const layer = layerRef.current;
    if (!layer) return;

    const rect = layer.getBoundingClientRect();
    const cx = rect.width * CENTER_X;
    const cy = rect.height * CENTER_Y;

    if (modeRef.current === "scatter") {
      for (const b of ballsRef.current) {
        if (!b.active) continue;

        const px = b.x * rect.width;
        const py = b.y * rect.height;

        const { nx, ny } = normalize(px - cx, py - cy);

        // Slower outward kick, depth affects speed a little
        const depthFactor = clamp(1 - b.z * 0.2, 0.75, 1.25);

        b.vx = nx * rand(SCATTER_KICK_MIN, SCATTER_KICK_MAX) * depthFactor;
        b.vy = ny * rand(SCATTER_KICK_MIN, SCATTER_KICK_MAX) * depthFactor;

        // Gentle depth drift
        b.vz += rand(-0.0015, 0.0015);
      }

      // Ensure loop is running
      if (!rafRef.current && !reduced) {
        lastTRef.current = 0;
        rafRef.current = requestAnimationFrame(() => {});
      }
    } else {
      respawnAll();

      // Ensure loop is running
      if (!rafRef.current && !reduced) {
        lastTRef.current = 0;
        rafRef.current = requestAnimationFrame(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scatter]);

  useEffect(() => {
    if (reduced) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const layer = layerRef.current;
    if (!layer) return;

    const tick = (t: number) => {
      if (!lastTRef.current) lastTRef.current = t;
      const dtMs = t - lastTRef.current;
      lastTRef.current = t;

      const dt = clamp(dtMs / 16.67, 0.5, 2.0);

      const rect = layer.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const balls = ballsRef.current;
      const mode = modeRef.current;

      if (mode === "cluster") {
        // Integrate with gravity
        for (const b of balls) {
          if (!b.active) continue;

          const dx = CENTER_X - b.x;
          const dy = CENTER_Y - b.y;

          b.vx += dx * GRAVITY * dt;
          b.vy += dy * GRAVITY * dt;

          // Depth spring toward 0
          b.vz += (-b.z) * Z_SPRING * dt;

          // Damping
          b.vx *= Math.pow(DAMPING, dt);
          b.vy *= Math.pow(DAMPING, dt);
          b.vz *= Math.pow(Z_DAMPING, dt);

          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.z += b.vz * dt;

          b.z = clamp(b.z, -1, 1);

          // Contain in a circle
          const cx = b.x - CENTER_X;
          const cy = b.y - CENTER_Y;
          const d = Math.hypot(cx, cy);

          if (d > CLUSTER_RADIUS) {
            const k = CLUSTER_RADIUS / (d || 1);
            b.x = CENTER_X + cx * k;
            b.y = CENTER_Y + cy * k;

            // Soften at boundary
            b.vx *= 0.85;
            b.vy *= 0.85;
          }
        }

        // Collision pass (2D)
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i];
          if (!a.active) continue;
          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];
            if (!b.active) continue;
            resolveCollision2D(a, b, w, h);
          }
        }
      } else {
        // Scatter integration
        let activeCount = 0;

        for (const b of balls) {
          if (!b.active) continue;
          activeCount += 1;

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          b.vx *= Math.pow(SCATTER_ACCEL, dt);
          b.vy *= Math.pow(SCATTER_ACCEL, dt);

          // Cap speed
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > MAX_SPEED) {
            const k = MAX_SPEED / (sp || 1);
            b.vx *= k;
            b.vy *= k;
          }

          // Depth drift and clamp
          b.z += b.vz * dt;
          b.vz *= Math.pow(0.985, dt);
          b.z = clamp(b.z, -1, 1);

          // Kill once far outside
          const px = b.x * w;
          const py = b.y * h;

          if (
            px < -OFFSCREEN_PADDING_PX ||
            px > w + OFFSCREEN_PADDING_PX ||
            py < -OFFSCREEN_PADDING_PX ||
            py > h + OFFSCREEN_PADDING_PX
          ) {
            b.active = false;
            const node = nodesRef.current.get(b.id);
            if (node) node.style.display = "none";
          }
        }

        // If everything is offscreen, stop the loop to save CPU
        if (activeCount === 0) {
          rafRef.current = null;
          return;
        }
      }

      // Render
      for (const b of balls) {
        const node = nodesRef.current.get(b.id);
        if (!node) continue;

        if (!b.active) {
          node.style.display = "none";
          continue;
        }

        node.style.display = "block";
        node.style.width = `${b.r * 2}px`;
        node.style.height = `${b.r * 2}px`;

        const px = b.x * w;
        const py = b.y * h;

        const depthScale = clamp(1 + b.z * Z_SCALE, 0.55, 1.65);

        // Fade as it scatters away from the center, also depth affects opacity
        const dist = Math.hypot(b.x - CENTER_X, b.y - CENTER_Y);
        const scatterFade = mode === "scatter" ? clamp(1 - dist * 1.25, 0.08, 1) : 1;

        const depthOpacity = clamp(b.baseOpacity * (1 + b.z * Z_OPACITY), 0.15, 1);
        const finalOpacity = clamp(depthOpacity * scatterFade, 0.08, 1);

        node.style.transform = `translate3d(${px - b.r}px, ${py - b.r}px, ${b.z * Z_PX}px) scale(${depthScale})`;
        node.style.opacity = `${finalOpacity}`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <div className={styles.layer} aria-hidden="true" ref={layerRef}>
      {initial.map((b) => (
        <div
          key={b.id}
          ref={(el) => {
            if (el) nodesRef.current.set(b.id, el);
            else nodesRef.current.delete(b.id);
          }}
          className={`${styles.ball} ${styles[b.colorClass]}`}
          style={{
            width: b.r * 2,
            height: b.r * 2,
            opacity: b.baseOpacity,
            transform: "translate3d(-9999px, -9999px, 0)",
          }}
        />
      ))}
    </div>
  );
}