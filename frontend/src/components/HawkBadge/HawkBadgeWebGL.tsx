import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import styles from "./HawkBadgeWebGL.module.css";
import hawkSvgUrl from "../../assets/golden-hawk.svg?url";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function HawkBadgeWebGL() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // @ts-ignore
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearAlpha(0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 5, 6);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-5, 2, 4);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    // Fixed 30 degrees clockwise
    const baseRotationZ = -Math.PI / 6;

    // Interaction state
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    let userRotY = 0;
    let velY = 0;

    let userHasInteracted = false;

    const ROT_SPEED = 0.005;
    const DAMPING = 0.95; // friction, lower = slows down faster
    const MAX_VEL_Y = 0.12; // clamp spin speed

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      userHasInteracted = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        (renderer.domElement as any).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      // Only allow spinning left/right around the vertical (Y) axis
      velY += dx * ROT_SPEED;
      velY = clamp(velY, -MAX_VEL_Y, MAX_VEL_Y);
    };

    const endDrag = (e: PointerEvent) => {
      dragging = false;
      try {
        (renderer.domElement as any).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag, { passive: true });
    window.addEventListener("pointercancel", endDrag, { passive: true });

    // Load solid hawk from SVG
    const loader = new SVGLoader();

    let mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial> | null = null;
    let geom: THREE.ExtrudeGeometry | null = null;
    let mat: THREE.MeshStandardMaterial | null = null;

    loader.load(
      hawkSvgUrl,
      (data) => {
        const shapes: THREE.Shape[] = [];
        for (const p of data.paths) shapes.push(...SVGLoader.createShapes(p));

        geom = new THREE.ExtrudeGeometry(shapes, {
          depth: 1.4,
          bevelEnabled: true,
          bevelThickness: 0.12,
          bevelSize: 0.06,
          bevelSegments: 3,
          curveSegments: 12,
        });

        geom.computeBoundingBox();
        const box = geom.boundingBox;
        if (box) {
          const cx = (box.min.x + box.max.x) / 2;
          const cy = (box.min.y + box.max.y) / 2;
          const cz = (box.min.z + box.max.z) / 2;
          geom.translate(-cx, -cy, -cz);
        }

        const sXY = 0.0035; // requested overall size
        const sZ = 0.04; // compensate thickness so it stays chunky
        geom.scale(sXY, -sXY, sZ);

        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#FDB913"),
          roughness: 0.35,
          metalness: 0.15,
          side: THREE.DoubleSide,
        });

        mesh = new THREE.Mesh(geom, mat);
        group.add(mesh);
      },
      undefined,
      () => {
        // ignore load errors
      }
    );

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf: number | null = null;

    const tick = () => {
      const t = clock.getElapsedTime();

      // hover always
      group.position.y = Math.sin(t * 1.1) * 0.18;

      // friction, slow down when not dragging
      if (!dragging) {
        velY *= DAMPING;
      }

      userRotY += velY;

      // gentle idle rotation (always on, very slow)
      const idleSpin = t * 0.2;

      group.rotation.y = idleSpin + userRotY;
      group.rotation.x = 0.08; // fixed slight tilt for depth
      group.rotation.z = baseRotationZ; // keep your 30° clockwise orientation

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);

      if (raf) cancelAnimationFrame(raf);

      if (mesh) group.remove(mesh);
      if (geom) geom.dispose();
      if (mat) mat.dispose();

      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={styles.layer} aria-hidden="true">
      <div ref={hostRef} className={styles.hit} />
    </div>
  );
}