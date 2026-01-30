import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./BallFieldWebGL.module.css";

type Ball = {
  active: boolean;
  r: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isGold: boolean;
  meshIndex: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const clamp01 = (n: number) => clamp(n, 0, 1);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function BallFieldWebGL({ scatterAmount }: { scatterAmount: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  // latest scatterAmount without rebuilding scene
  const scatterAmountRef = useRef(0);
  scatterAmountRef.current = clamp01(scatterAmount);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    camera.position.set(0, 0, 16);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // @ts-ignore
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearAlpha(0);
    host.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f1020, 1.1);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(7, 9, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55);
    fillLight.position.set(-7, -2, 6);
    scene.add(fillLight);

    // Geometry
    const geometry = new THREE.SphereGeometry(1, 28, 22);

    // Laurier materials (no instanceColor)
    const purpleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#4B2E83"),
      roughness: 0.32,
      metalness: 0.08,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FDB913"),
      roughness: 0.32,
      metalness: 0.08,
    });

    // Settings
    const COUNT = 46;
    const goldCount = Math.floor(COUNT / 3);
    const purpleCount = COUNT - goldCount;

    const purpleMesh = new THREE.InstancedMesh(geometry, purpleMat, purpleCount);
    const goldMesh = new THREE.InstancedMesh(geometry, goldMat, goldCount);

    purpleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    goldMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    scene.add(purpleMesh);
    scene.add(goldMesh);

    // Physics constants
    const CENTER = new THREE.Vector3(0, 0, 0);

    const CLUSTER_RADIUS = 5.2;
    const GRAVITY = 0.22;
    const DRAG_CLUSTER = 0.985;

    const RESTITUTION = 0.72;
    const COLLISION_PASSES = 1;

    // Continuous scatter tuning (driven by scatterAmount 0..1)
    const OUTWARD_FORCE = 3.2; // outward accel scale
    const DRAG_SCATTER = 0.992; // less damping while scattering
    const MAX_SPEED_CLUSTER = 1.7;
    const MAX_SPEED_SCATTER = 7.0;

    // When scattering, kill far spheres to save CPU
    const OFFSCREEN_KILL_RADIUS = 20;

    // When scatterAmount goes back near 0, revive and re-cluster
    const REVIVE_THRESHOLD = 0.02;

    // Bigger balls
    const R_MIN = 0.48;
    const R_MAX = 0.95;

    // Mouse “hand” interaction (cylinder along camera Z, ignore Z distance)
    const HAND_RADIUS = 2.2;
    const HAND_STRENGTH = 13.0;
    const HAND_DAMPING = 0.85;

    // Mouse mapping to z=0 plane
    const pointerNDC = new THREE.Vector2(0, 0);
    const handPos = new THREE.Vector3(999, 999, 0);
    const handActive = { value: false };

    const raycaster = new THREE.Raycaster();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const updateHandFromClientXY = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return;

      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!inside) {
        handActive.value = false;
        handPos.set(999, 999, 0);
        return;
      }

      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      pointerNDC.set(x, y);
      raycaster.setFromCamera(pointerNDC, camera);
      raycaster.ray.intersectPlane(planeZ0, handPos);
      handActive.value = true;
    };

    const onPointerMove = (ev: PointerEvent) => {
      updateHandFromClientXY(ev.clientX, ev.clientY);
    };

    const onScrollOrResize = () => {
      handActive.value = false;
      handPos.set(999, 999, 0);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    // Build balls and assign mesh indices (2 purple, 1 gold)
    let pIdx = 0;
    let gIdx = 0;

    const balls: Ball[] = Array.from({ length: COUNT }).map((_, i) => {
      const isGold = i % 3 === 2;
      const meshIndex = isGold ? gIdx++ : pIdx++;

      const r = rand(R_MIN, R_MAX);

      const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1));
      if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
      dir.normalize();

      const dist = rand(0, CLUSTER_RADIUS * 0.55);
      const pos = dir.multiplyScalar(dist);

      const vel = new THREE.Vector3(rand(-0.12, 0.12), rand(-0.12, 0.12), rand(-0.12, 0.12));

      return { active: true, r, pos, vel, isGold, meshIndex };
    });

    const dummy = new THREE.Object3D();

    const applyInstance = (b: Ball) => {
      if (!b.active) {
        dummy.position.set(0, 0, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        if (b.isGold) goldMesh.setMatrixAt(b.meshIndex, dummy.matrix);
        else purpleMesh.setMatrixAt(b.meshIndex, dummy.matrix);
        return;
      }

      dummy.position.copy(b.pos);
      dummy.scale.setScalar(b.r);
      dummy.updateMatrix();
      if (b.isGold) goldMesh.setMatrixAt(b.meshIndex, dummy.matrix);
      else purpleMesh.setMatrixAt(b.meshIndex, dummy.matrix);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    // Helpers
    const tmp = new THREE.Vector3();
    const n = new THREE.Vector3();

    const capSpeed = (v: THREE.Vector3, max: number) => {
      const sp = v.length();
      if (sp > max) v.multiplyScalar(max / (sp || 1));
    };

    const resolveCollision = (a: Ball, b: Ball) => {
      n.copy(b.pos).sub(a.pos);
      const dist = n.length();
      const minDist = a.r + b.r;

      if (dist <= 0 || dist >= minDist) return;

      n.multiplyScalar(1 / dist);

      const overlap = minDist - dist;

      const massA = a.r * a.r * a.r;
      const massB = b.r * b.r * b.r;

      const invA = 1 / massA;
      const invB = 1 / massB;
      const invSum = invA + invB;

      a.pos.addScaledVector(n, -overlap * (invA / invSum));
      b.pos.addScaledVector(n, overlap * (invB / invSum));

      tmp.copy(b.vel).sub(a.vel);
      const velAlongNormal = tmp.dot(n);
      if (velAlongNormal > 0) return;

      const j = (-(1 + RESTITUTION) * velAlongNormal) / invSum;

      tmp.copy(n).multiplyScalar(j);
      a.vel.addScaledVector(tmp, -invA);
      b.vel.addScaledVector(tmp, invB);
    };

    const respawnAll = () => {
      for (const b of balls) {
        b.active = true;

        const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1));
        if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
        dir.normalize();

        const dist = rand(0, CLUSTER_RADIUS * 0.55);
        b.pos.copy(dir.multiplyScalar(dist));

        b.vel.set(rand(-0.12, 0.12), rand(-0.12, 0.12), rand(-0.12, 0.12));
      }
    };

    // Cursor cylinder force in XY plane
    const applyHandForces = (dtSec: number) => {
      if (!handActive.value) return;

      for (const b of balls) {
        if (!b.active) continue;

        const dx = b.pos.x - handPos.x;
        const dy = b.pos.y - handPos.y;

        const d = Math.hypot(dx, dy);
        const reach = HAND_RADIUS + b.r;

        if (d >= reach) continue;

        const inv = 1 / (d || 1);
        const nx = dx * inv;
        const ny = dy * inv;

        const t = clamp01(1 - d / reach);
        const strength = HAND_STRENGTH * t * t;

        b.vel.x += nx * strength * dtSec;
        b.vel.y += ny * strength * dtSec;

        b.vel.multiplyScalar(Math.pow(HAND_DAMPING, dtSec * 60));
      }
    };

    // Init matrices
    for (const b of balls) applyInstance(b);
    purpleMesh.instanceMatrix.needsUpdate = true;
    goldMesh.instanceMatrix.needsUpdate = true;

    const clock = new THREE.Clock();
    let raf: number | null = null;

    // Track whether we were in cluster-ish state recently, used for respawn
    let wasCluster = true;

    const step = () => {
      const dtSec = clamp(clock.getDelta(), 0.008, 0.03);
      const dt = dtSec * 60;

      const s = clamp01(scatterAmountRef.current);

      const isClusterish = s < REVIVE_THRESHOLD;
      if (isClusterish && !wasCluster) {
        respawnAll();
      }
      wasCluster = isClusterish;

      if (isClusterish) {
        // Cluster mode
        applyHandForces(dtSec);

        for (const b of balls) {
          // Pull to center
          tmp.copy(CENTER).sub(b.pos);
          b.vel.addScaledVector(tmp, GRAVITY * dtSec);

          // Damping
          b.vel.multiplyScalar(Math.pow(DRAG_CLUSTER, dt));
          capSpeed(b.vel, MAX_SPEED_CLUSTER);

          // Integrate
          b.pos.addScaledVector(b.vel, dt);

          // Contain in sphere
          const d = b.pos.length();
          if (d > CLUSTER_RADIUS) {
            b.pos.multiplyScalar(CLUSTER_RADIUS / (d || 1));
            b.vel.multiplyScalar(0.85);
          }
        }

        // Collisions
        for (let pass = 0; pass < COLLISION_PASSES; pass++) {
          for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
              resolveCollision(balls[i], balls[j]);
            }
          }
        }

        // Ensure alive
        for (const b of balls) b.active = true;
      } else {
        // Scatter mode, continuous, proportional to s
        let activeCount = 0;

        for (const b of balls) {
          if (!b.active) continue;
          activeCount++;

          // Outward direction
          tmp.copy(b.pos);
          const len = tmp.length();
          if (len > 1e-6) tmp.multiplyScalar(1 / len);
          else tmp.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();

          // Stronger outward acceleration as s increases
          b.vel.addScaledVector(tmp, OUTWARD_FORCE * s * dtSec);

          // Lighter drag as scatter increases
          const drag = DRAG_SCATTER + (1 - DRAG_SCATTER) * (1 - s);
          b.vel.multiplyScalar(Math.pow(drag, dt));

          capSpeed(b.vel, MAX_SPEED_SCATTER);

          b.pos.addScaledVector(b.vel, dt);

          if (b.pos.length() > OFFSCREEN_KILL_RADIUS) b.active = false;
        }

        // If all gone, stop work until s drops and we respawn
        if (activeCount === 0) {
          for (const b of balls) applyInstance(b);
          purpleMesh.instanceMatrix.needsUpdate = true;
          goldMesh.instanceMatrix.needsUpdate = true;
          renderer.render(scene, camera);
          raf = null;
          return;
        }
      }

      // Update matrices
      for (const b of balls) applyInstance(b);
      purpleMesh.instanceMatrix.needsUpdate = true;
      goldMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScrollOrResize);

      if (raf) cancelAnimationFrame(raf);

      scene.remove(purpleMesh);
      scene.remove(goldMesh);

      geometry.dispose();
      purpleMat.dispose();
      goldMat.dispose();

      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className={styles.webglLayer} aria-hidden="true" />;
}