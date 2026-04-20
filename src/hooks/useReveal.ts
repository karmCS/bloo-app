import { useCallback, useRef } from 'react';

export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elRef = useRef<T | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      elRef.current = node;
      if (!node) return;
      if (typeof IntersectionObserver === 'undefined') {
        node.classList.add('in');
        return;
      }
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold }
      );
      obs.observe(node);
      observerRef.current = obs;
    },
    [threshold]
  );

  return ref;
}
