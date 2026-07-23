import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Prometheus Metrics Setup ────────────────────────────────────────────────
  const SERVICE_NAME = 'support-service';
  const metricsRegistry = new Registry();
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

  app.use('/metrics', async (_req: any, res: any) => {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  });
  // ── End Metrics ─────────────────────────────────────────────────────────────

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3006;
  await app.listen(port, '0.0.0.0');
  console.log(`Support Service is running on port ${port}`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
}
bootstrap();
