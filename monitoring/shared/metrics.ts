import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Shared Prometheus metrics registry & instruments.
 * Import setupMetrics() in each service's main.ts.
 */

export const registry = new Registry();

// ── Default Node.js metrics (heap, CPU, GC, event loop) ──────────────────────
collectDefaultMetrics({ register: registry });

// ── HTTP Request Counter ──────────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [registry],
});

// ── HTTP Request Duration Histogram ──────────────────────────────────────────
export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [registry],
});

/**
 * Creates an Express-compatible middleware that records HTTP metrics.
 * @param serviceName - The name of the service (e.g. 'user-service')
 */
export function createMetricsMiddleware(serviceName: string) {
  return (req: any, res: any, next: any) => {
    // Skip /metrics endpoint itself from being tracked
    if (req.path === '/metrics') return next();

    const start = Date.now();
    const route = req.route?.path || req.path || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
        service: serviceName,
      };
      httpRequestsTotal.inc(labels);
      httpRequestDurationMs.observe(labels, duration);
    });

    next();
  };
}

/**
 * Returns the metrics text output for the /metrics endpoint.
 */
export async function getMetricsOutput(): Promise<string> {
  return registry.metrics();
}
