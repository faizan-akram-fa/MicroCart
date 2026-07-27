import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import rateLimit from 'express-rate-limit';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import multer from 'multer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse incoming multipart file streams into memory buffers only for multipart requests
  const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  }).any();

  app.use((req: any, res: any, next: any) => {
    if (req.path === '/api/health' || req.path === '/health' || req.path === '/metrics') {
      return next();
    }
    const contentType = req.headers['content-type'] || req.headers['Content-Type'] || '';
    if (contentType.toString().toLowerCase().includes('multipart/form-data')) {
      return memoryUpload(req, res, (err: any) => {
        if (err) {
          console.error('[ApiGateway] Multipart parse error:', err?.message || err);
          return next(err);
        }
        next();
      });
    }
    next();
  });

  // ── Prometheus Metrics Setup ────────────────────────────────────────────────
  const SERVICE_NAME = 'api-gateway';
  const metricsRegistry = new Registry();
  metricsRegistry.clear();
  metricsRegistry.setDefaultLabels({ service: SERVICE_NAME });
  collectDefaultMetrics({ register: metricsRegistry });

  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'service'],
    registers: [metricsRegistry],
  });
  const httpRequestDurationMs = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [metricsRegistry],
  });

  // Metrics middleware BEFORE rate limiter so /metrics is not rate-limited
  app.use('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });

  app.use((req: any, res: any, next: any) => {
    if (req.path === '/metrics') return next();
    const start = Date.now();
    res.on('finish', () => {
      const labels = { method: req.method, route: req.route?.path || req.path || 'unknown', status_code: String(res.statusCode), service: SERVICE_NAME };
      httpRequestsTotal.inc(labels);
      httpRequestDurationMs.observe(labels, Date.now() - start);
    });
    next();
  });
  // ── End Metrics ─────────────────────────────────────────────────────────────

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5000, // limit each IP to 5000 requests per windowMs
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway is running on port ${port}`);
  console.log(`Access at: http://localhost:${port}/api`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
}
bootstrap();
