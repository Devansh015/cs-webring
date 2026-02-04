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
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function BallFieldWebGL({ scatterAmount }: { scatterAmount: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const scatterRef = useRef(scatterAmount);

  useEffect(() => {
    scatterRef.current = scatterAmount;
  }, [scatterAmount]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
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

    // Geometry + Materials
    const geometry = new THREE.SphereGeometry(1, 28, 22);

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

    // Instances
    const COUNT = 46;
    const goldCount = Math.floor(COUNT / 3);
    const purpleCount = COUNT - goldCount;

    const purpleMesh = new THREE.InstancedMesh(geometry, purpleMat, purpleCount);
    const goldMesh = new THREE.InstancedMesh(geometry, goldMat, goldCount);

    purpleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    goldMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    scene.add(purpleMesh);
    scene.add(goldMesh);

    // Ball state
    const balls: Ball[] = [];
    let purpleIdx = 0;
    let goldIdx = 0;

    for (let i = 0; i < COUNT; i++) {
      const isGold = i < goldCount;
      const r = rand(28, 56);
      const theta = rand(0, Math.PI * 2);
      const phi = rand(0, Math.PI);
      const dist = rand(40, 180);
      const x = dist * Math.sin(phi) * Math.cos(theta);
      const y = dist * Math.sin(phi) * Math.sin(theta);
      const z = dist * Math.cos(phi);

      balls.push({
        active: true,
        r,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.4, 0.4)),
        isGold,
        meshIndex: isGold ? goldIdx++ : purpleIdx++,
      });
    }

    const dummy = new THREE.Object3D();

    const updateInstances = () => {
      const scatter = scatterRef.current;
      for (const ball of balls) {
        if (!ball.active) continue;

        // Apply velocity based on scatter
        const speed = 2 + scatter * 14;
        ball.pos.add(ball.vel.clone().multiplyScalar(speed));

        // Fade out as they go far
        const dist = ball.pos.length();
        if (dist > 1200) ball.active = false;

        dummy.position.copy(ball.pos);
        dummy.scale.setScalar(ball.r);
        dummy.updateMatrix();

        if (ball.isGold) {
          goldMesh.setMatrixAt(ball.meshIndex, dummy.matrix);
        } else {
          purpleMesh.setMatrixAt(ball.meshIndex, dummy.matrix);
        }
      }
      purpleMesh.instanceMatrix.needsUpdate = true;
      goldMesh.instanceMatrix.needsUpdate = true;
    };

    // Resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    onResize();

    // Animate
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      updateInstances();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className={styles.webglLayer} />;
}
