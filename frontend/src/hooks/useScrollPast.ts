import { useEffect, useState } from "react";

export function useScrollPast<T extends Element>(
  ref: React.RefObject<T | null>,
  offsetPx: number = 0
) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      // rect.bottom is distance from top of viewport to bottom of hero
      // when it goes above offset, we are past the hero
      setPast(rect.bottom <= offsetPx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, offsetPx]);

  return past;
}