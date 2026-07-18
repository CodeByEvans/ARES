import { useCallback } from "react";
export function useMouseGlow<T extends HTMLElement>() {
  return useCallback((event: React.MouseEvent<T>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--mouse-x",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--mouse-y",
      `${event.clientY - rect.top}px`,
    );
  }, []);
}
