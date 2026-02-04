import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./HawkBadgeWebGL.module.css";

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
    renderer.setClearAlpha(0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    // Create a simple badge sphere
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FDB913"),
      roughness: 0.3,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(geometry, material);
    scene.add(badge);

    // Floating animation
    let time = 0;
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      time += 0.016;

      badge.position.y = Math.sin(time * 1.2) * 0.15;
      badge.rotation.y += 0.008;

      renderer.render(scene, camera);
    };

    const onResize = () => {
      const size = Math.min(host.clientWidth, host.clientHeight);
      renderer.setSize(size, size);
    };
    onResize();
    window.addEventListener("resize", onResize);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={styles.layer}>
      <div ref={hostRef} className={styles.hit} />
    </div>
  );
}
