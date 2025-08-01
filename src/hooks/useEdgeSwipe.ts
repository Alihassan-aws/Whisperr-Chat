import { useEffect, useRef } from "react";

const EDGE_THRESHOLD = 30; // Pixels from edge to consider it an edge swipe

export function useEdgeSwipe(onSwipeFromLeft: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      
      // Check if swipe started from left edge and moved right
      if (startX < EDGE_THRESHOLD && endX > startX + 50) {
        onSwipeFromLeft();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeFromLeft]);

  return ref;
}