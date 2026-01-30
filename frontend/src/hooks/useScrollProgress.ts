import { useEffect, useState } from "react";

export function useScrollProgress(
    containerRef: React.RefObject<HTMLElement | null>
    ) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;

      // container scroll span: when its top hits top (0) to when its bottom hits top
      const total = rect.height - viewportH;
      const scrolled = -rect.top;

      const p = total <= 0 ? 1 : scrolled / total;
      setProgress(Math.max(0, Math.min(1, p)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef]);

  return progress;
}