import { useEffect, useRef, useState } from "react";
import BallFieldWebGL from "../BallFieldWebGL/BallFieldWebGL";
import MembersList from "../MembersList/MembersList";
import HawkBadgeWebGL from "../HawkBadge/HawkBadgeWebGL";
import { sites } from "../../../../data/webring.json";
import styles from "./Scene.module.css";
import { useSmoothScrollProgress } from "../../hooks/useSmoothScrollProgress";

export default function Scene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const p = useSmoothScrollProgress(sceneRef, { followSpeed: 12, maxStep: 0.03 });
  const autoScrollDoneRef = useRef(false);
  const autoScrollCancelRef = useRef(false);

  // Scatter happens early
  const scatterAmount = clamp01(remap(p, 0.0, 0.28));

  // List launches after scatter is basically done
  const listLaunch = clamp01(remap(p, 0.36, 0.46));
  const listVisible = listLaunch > 0.05;

  // Track whether the balls have fully dispersed at least once
  const [ballsFinished, setBallsFinished] = useState(false);
  const [hasVisitedList, setHasVisitedList] = useState(false);

  // "Gone" means scatter basically maxed, plus a little time for them to exit
  const ballsGone = clamp01(remap(scatterAmount, 0.92, 1.0));

  useEffect(() => {
    if (!ballsFinished && ballsGone >= 0.99) setBallsFinished(true);
  }, [ballsGone, ballsFinished]);

  useEffect(() => {
    if (listVisible) setHasVisitedList(true);
  }, [listVisible]);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const TRIGGER_PROGRESS = 0.30; // user has scrolled far enough to commit to the transition
    const TARGET_PROGRESS = 0.46; // where the list is fully settled

    const computeRawP = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const scrolled = -rect.top;
      return total <= 0 ? 0 : clamp01(scrolled / total);
    };

    const startAutoScrollIfNeeded = () => {
      if (autoScrollDoneRef.current) return;

      const rawP = computeRawP();

      // Only trigger after user has scrolled enough to start the experience
      if (rawP < TRIGGER_PROGRESS) return;

      // Never pull the user upward, if they already passed the target, do nothing
      if (rawP >= TARGET_PROGRESS - 0.01) {
        autoScrollDoneRef.current = true;
        return;
      }

      // Compute absolute target Y
      const rect = el.getBoundingClientRect();
      const sceneTop = window.scrollY + rect.top;
      const scrollSpan = Math.max(1, el.offsetHeight - window.innerHeight);
      const targetY = sceneTop + scrollSpan * TARGET_PROGRESS;

      // Extra safety, never scroll upward
      if (window.scrollY >= targetY - 8) {
        autoScrollDoneRef.current = true;
        return;
      }

      autoScrollCancelRef.current = false;

      // Cancel if the user interacts
      const cancel = () => {
        autoScrollCancelRef.current = true;
        autoScrollDoneRef.current = true;
        window.removeEventListener("wheel", cancel);
        window.removeEventListener("touchstart", cancel);
        window.removeEventListener("keydown", cancel);
      };

      window.addEventListener("wheel", cancel, { passive: true });
      window.addEventListener("touchstart", cancel, { passive: true });
      window.addEventListener("keydown", cancel);

      autoScrollDoneRef.current = true;

      // Drive scroll forward to complete the animation and land on the list
      requestAnimationFrame(() => {
        slowScrollToGuarded(targetY, 950, () => autoScrollCancelRef.current);
      });
    };

    // Try on scroll and also on an animation frame loop for trackpads that coast
    const onScroll = () => startAutoScrollIfNeeded();
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf: number | null = null;
    const tick = () => {
      startAutoScrollIfNeeded();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // initial check
    startAutoScrollIfNeeded();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Balls are visible only before they finish once
  const ballsOpacity = ballsFinished ? 0 : 1;

  // List motion
  const startYvh = 78;
  const endYvh = 0;
  const listY = lerp(startYvh, endYvh, easeOutCubic(listLaunch));

  // Show hovering hawk when user has been to the list and scrolls back up
  const showHawk = ballsFinished && hasVisitedList && !listVisible;

  const showArrow = p < 0.08 && !ballsFinished;

  const onArrowClick = () => {
    const el = sceneRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const sceneTop = window.scrollY + rect.top;

    const sceneHeight = el.offsetHeight;
    const vh = window.innerHeight;
    const scrollSpan = Math.max(1, sceneHeight - vh);

    const targetProgress = 0.42;
    slowScrollTo(sceneTop + scrollSpan * targetProgress, 1300);
  };

  return (
    <div ref={sceneRef} className={styles.scene}>
      <section className={styles.sticky}>
        {/* Title overlay: hide as soon as balls start dispersing */}
        {scatterAmount === 0 && (
          <div className={styles.titleOverlay}>
            <h1>CS RING</h1>
          </div>
        )}
        {!ballsFinished && (
          <div className={styles.balls} style={{ opacity: ballsOpacity }}>
            <BallFieldWebGL scatterAmount={scatterAmount} />
          </div>
        )}

        <div
          className={styles.listLayer}
          style={{
            transform: `translate3d(0, ${listY}vh, 0)`,
            opacity: clamp01(remap(listLaunch, 0.1, 0.25)),
          }}
        >
          <MembersList sites={sites} />
        </div>

        {showHawk && <HawkBadgeWebGL />}

        {showArrow && (
          <button type="button" className={styles.downArrow} onClick={onArrowClick} aria-label="Scroll down">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7L10 13L16 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function slowScrollTo(targetY: number, durationMs: number) {
  const startY = window.scrollY;
  const delta = targetY - startY;
  const start = performance.now();

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  const tick = (now: number) => {
    const t = clamp01((now - start) / durationMs);
    window.scrollTo(0, startY + delta * ease(t));
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function slowScrollToGuarded(targetY: number, durationMs: number, isCancelled: () => boolean) {
  const startY = window.scrollY;
  const delta = targetY - startY;

  // Never scroll upward
  if (delta <= 0) return;

  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  const tick = (now: number) => {
    if (isCancelled()) return;

    const t = clamp01((now - start) / durationMs);
    const nextY = startY + delta * ease(t);

    // Guard against any upward movement
    if (nextY >= window.scrollY) {
      window.scrollTo(0, nextY);
    }

    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}