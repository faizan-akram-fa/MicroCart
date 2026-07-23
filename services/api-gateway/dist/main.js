"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_rate_limit_1 = require("express-rate-limit");
const prom_client_1 = require("prom-client");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const SERVICE_NAME = 'api-gateway';
    const metricsRegistry = new prom_client_1.Registry();
    metricsRegistry.setDefaultLabels({ service: SERVICE_NAME });
    (0, prom_client_1.collectDefaultMetrics)({ register: metricsRegistry });
    const httpRequestsTotal = new prom_client_1.Counter({
        name: 'http_requests_total',
        help: 'Total HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'service'],
        registers: [metricsRegistry],
    });
    const httpRequestDurationMs = new prom_client_1.Histogram({
        name: 'http_request_duration_ms',
        help: 'HTTP request duration in ms',
        labelNames: ['method', 'route', 'status_code', 'service'],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
        registers: [metricsRegistry],
    });
    app.use('/metrics', async (_req, res) => {
        res.set('Content-Type', metricsRegistry.contentType);
        res.end(await metricsRegistry.metrics());
    });
    app.use((req, res, next) => {
        if (req.path === '/metrics')
            return next();
        const start = Date.now();
        res.on('finish', () => {
            const labels = { method: req.method, route: req.route?.path || req.path || 'unknown', status_code: String(res.statusCode), service: SERVICE_NAME };
            httpRequestsTotal.inc(labels);
            httpRequestDurationMs.observe(labels, Date.now() - start);
        });
        next();
    });
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 5000,
    }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`API Gateway is running on port ${port}`);
    console.log(`Access at: http://localhost:${port}/api`);
    console.log(`Metrics available at http://localhost:${port}/metrics`);
}
bootstrap();
//# sourceMappingURL=main.js.map