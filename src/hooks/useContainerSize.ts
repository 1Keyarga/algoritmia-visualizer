import { useEffect, useState, type RefObject } from 'react';

export interface ContainerSize {
  width: number;
  height: number;
}

function readSize(el: HTMLElement): ContainerSize {
  const rect = el.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/**
 * Tracks an element's layout size across window resize, ResizeObserver,
 * and visualViewport changes (browser zoom).
 */
export function useContainerSize(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean = true
): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readSize(el);
        setSize((prev) =>
          prev.width === next.width && prev.height === next.height ? prev : next
        );
      });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    update();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [ref, enabled]);

  return size;
}
