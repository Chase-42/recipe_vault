import { useEffect, useRef } from "react";
import { logger } from "~/lib/logger";

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    renderCount: 0,
    averageRenderTime: 0,
  });

  useEffect(() => {
    renderStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      metrics.current.renderCount++;
      metrics.current.renderTime = renderTime;
      metrics.current.averageRenderTime =
        (metrics.current.averageRenderTime * (metrics.current.renderCount - 1) +
          renderTime) /
        metrics.current.renderCount;

      // Log performance metrics in development
      if (process.env.NODE_ENV === "development") {
        logger.debug(`Performance metrics for ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          averageRenderTime: `${metrics.current.averageRenderTime.toFixed(2)}ms`,
          renderCount: metrics.current.renderCount,
        });
      }

      // Warn if render time is too high
      if (renderTime > 16) {
        // 16ms = 60fps threshold
        logger.warn(`Performance warning: ${componentName} slow render`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          threshold: "16ms",
        });
      }
    };
  });

  return metrics.current;
}
