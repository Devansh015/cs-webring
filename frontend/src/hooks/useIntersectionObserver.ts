import { useEffect, useState } from "react";

export function useIntersectionObserver<T extends Element>(
  ref: React.RefObject<T | null>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options.root, options.rootMargin, options.threshold]);

  return isIntersecting;
}