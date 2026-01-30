import { useEffect, useState } from "react";

export function useScrollThreshold(thresholdPx: number) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setPast(window.scrollY > thresholdPx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);

  return past;
}