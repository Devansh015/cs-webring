import { useRef } from "react";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import BallFieldWebGL from "../BallFieldWebGL/BallFieldWebGL";
import Members from "../Members/Members";
import styles from "./Scene.module.css";

export default function Scene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const membersRef = useRef<HTMLElement | null>(null);

  const p = useScrollProgress(sceneRef); // 0..1

  const scatterAmount = clamp01(remap(p, 0.0, 0.55));
  const listAmount = clamp01(remap(p, 0.25, 0.85));
  const ballsOpacity = 1 - clamp01(remap(p, 0.55, 0.95));

  return (
    <div ref={sceneRef} className={styles.scene}>
      <section className={styles.sticky}>
        <div className={styles.balls} style={{ opacity: ballsOpacity }}>
          <BallFieldWebGL scatterAmount={scatterAmount} />
        </div>

        <div
          className={styles.listLayer}
          style={{
            transform: `translate3d(0, ${(1 - listAmount) * 70}vh, 0)`,
            opacity: clamp01(remap(p, 0.18, 0.35)),
          }}
        >
          <Members sectionRef={membersRef} />
        </div>
      </section>
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function remap(v: number, a: number, b: number) {
  return (v - a) / (b - a);
}