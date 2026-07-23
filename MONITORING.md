# 📊 MicroCart — Monitoring & Observability Guide

> **Stack**: Prometheus · Grafana · Loki · Promtail  
> **Author**: MicroCart Team  
> **Last Updated**: 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Accessing the Dashboards](#accessing-the-dashboards)
4. [Prometheus — Metrics Collection](#prometheus--metrics-collection)
5. [Grafana — Visualization](#grafana--visualization)
6. [Loki — Log Aggregation](#loki--log-aggregation)
7. [Promtail — Log Shipping](#promtail--log-shipping)
8. [Available Metrics](#available-metrics)
9. [Writing PromQL Queries](#writing-promql-queries)
10. [Writing LogQL Queries](#writing-logql-queries)
11. [Adding Metrics to a New Service](#adding-metrics-to-a-new-service)
12. [Alerting Setup](#alerting-setup)
13. [Troubleshooting](#troubleshooting)
14. [File Structure](#file-structure)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MicroCart Services                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │user-service│  │product-svc │  │cart-service│  │order-svc │  │
│  │  :3001     │  │   :3002    │  │   :3003    │  │  :3004   │  │
│  │ /metrics ◄─┼──┼────────────┼──┼────────────┼──┼──────────┼──┼──┐
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │wishlist-svc │  │support-svc   │  │api-gateway   │           │  │
│  │   :3005     │  │    :3006     │  │   :4000      │           │  │
│  │ /metrics ◄──┼──┼──────────────┼──┼──────────────┼───────────┼──┘
│  └─────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
             │ scrape every 10s                    │ stdout logs
             ▼                                     ▼
    ┌─────────────────┐                  ┌───────────────────┐
    │   Prometheus    │                  │     Promtail      │
    │   :9090         │                  │  reads Docker     │
    │  Time-series DB │                  │  socket + logs    │
    └────────┬────────┘                  └────────┬──────────┘
             │                                    │ ships to
             │                                    ▼
             │                          ┌───────────────────┐
             │                          │       Loki        │
             │                          │     :3100         │
             │                          │  Log aggregator   │
             │                          └────────┬──────────┘
             │                                   │
             └─────────────────┬─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │      Grafana        │
                    │      :3010          │
                    │  Dashboards &       │
                    │  Visualization      │
                    └─────────────────────┘
```

---

## Quick Start

### Start the Full Stack (App + Monitoring)

```bash
# Start everything including monitoring
docker compose up -d

# Or start just the monitoring stack
docker compose up -d prometheus grafana loki promtail
```

### Verify All Monitoring Containers are Running

```bash
docker compose ps | grep -E "prometheus|grafana|loki|promtail"
```

Expected output:
```
prometheus    running    0.0.0.0:9090->9090/tcp
grafana       running    0.0.0.0:3010->3010/tcp
loki          running    0.0.0.0:3100->3100/tcp
promtail      running
```

### Stop Monitoring Stack

```bash
docker compose stop prometheus grafana loki promtail
```

---

## Accessing the Dashboards

| Tool | URL | Credentials |
|------|-----|-------------|
| **Grafana** | http://localhost:3010 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | No auth |
| **Loki (API)** | http://localhost:3100 | No auth |

### Grafana First Login
1. Open http://localhost:3010
2. Login with `admin` / `admin123`
3. Navigate to **Dashboards → MicroCart → MicroCart — Microservices Monitoring**
4. The dashboard loads automatically with live data ✅

> **Security Note**: Anonymous viewer access is **DISABLED**. Users MUST log in with valid credentials (`admin` / `admin123`) before accessing any dashboards or monitoring metrics.

---

## Prometheus — Metrics Collection

Prometheus scrapes the `/metrics` endpoint of each service every **10 seconds**.

### Check All Targets are UP

1. Open http://localhost:9090/targets
2. All 7 targets should show **State: UP** (green)

```
api-gateway      (1/1 up)
user-service     (1/1 up)
product-service  (1/1 up)
cart-service     (1/1 up)
order-service    (1/1 up)
wishlist-service (1/1 up)
support-service  (1/1 up)
```

### Test a Service's Metrics Endpoint

```bash
# From your host machine
curl http://localhost:3001/metrics   # user-service
curl http://localhost:3002/metrics   # product-service
curl http://localhost:3004/metrics   # order-service

# Expected output (Prometheus text format):
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
# http_requests_total{method="GET",route="/users",status_code="200",service="user-service"} 42
```

### Reload Prometheus Config (Without Restart)

```bash
curl -X POST http://localhost:9090/-/reload
```

---

## Grafana — Visualization

### Pre-built Dashboard Panels

The **MicroCart — Microservices Monitoring** dashboard includes:

| Panel | Description |
|-------|-------------|
| **Total Requests/sec** | Real-time combined request rate across all services |
| **Overall Error Rate** | Percentage of 5xx responses globally |
| **Avg Response Time (p95)** | 95th percentile response time in ms |
| **Total Heap Used** | Combined Node.js heap memory in MB |
| **Services UP** | Count of healthy services (from Prometheus `up` metric) |
| **HTTP Request Rate — All Services** | Time-series per service |
| **Response Time p95 — All Services** | Latency comparison across services |
| **Heap Memory Used — Per Service** | Memory usage trends |
| **CPU Usage — Per Service** | CPU utilization per service |
| **HTTP 4xx Errors** | Client error rates per service |
| **HTTP 5xx Errors** | Server error rates (highlighted red) |
| **Live Logs — All Services** | Real-time Loki log stream |
| **Error Logs — All Services** | Filtered error/exception logs |
| **Order Service Logs** | Dedicated order service log view |

### Changing Time Range

Use the time picker in the top-right corner:
- Last 5 minutes (for real-time debugging)
- Last 1 hour (default)
- Last 24 hours (trend analysis)
- Custom range

### Auto-refresh

The dashboard auto-refreshes every **10 seconds** by default.

### Creating a New Dashboard

1. Click **+** → **New Dashboard**
2. Add Panel → Choose visualization type
3. Set datasource to **Prometheus** or **Loki**
4. Write your query (see sections below)
5. Save with `Ctrl+S`

---

## Loki — Log Aggregation

Loki stores structured logs from all Docker containers. Logs are labeled by:

| Label | Example Value |
|-------|---------------|
| `service` | `user-service`, `order-service` |
| `container` | `ecommerce-microservices-user-service-1` |
| `app` | `ecommerce-microservices` |
| `level` | `info`, `warn`, `error` |

### Viewing Logs in Grafana

1. Go to **Explore** (compass icon in left sidebar)
2. Select **Loki** datasource
3. Use the log browser or write LogQL queries

---

## Promtail — Log Shipping

Promtail reads Docker container logs via the Docker socket and ships them to Loki in real-time.

### Configuration

File: `monitoring/promtail/promtail-config.yml`

- Reads all running Docker containers
- Drops database container logs (postgres)
- Parses NestJS JSON log format
- Strips `debug` level logs to save space

### Manual Test

```bash
# Check Promtail is running and connected
docker compose logs promtail --tail=20

# Check Promtail targets
curl http://localhost:9080/targets 2>/dev/null || docker exec promtail wget -qO- http://localhost:9080/targets
```

---

## Available Metrics

All services expose these metrics at `/metrics`:

### HTTP Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total requests, labeled by method/route/status/service |
| `http_request_duration_ms` | Histogram | Request duration in ms (buckets: 5ms → 5000ms) |

### Node.js Default Metrics (from `prom-client`)

| Metric | Type | Description |
|--------|------|-------------|
| `nodejs_heap_size_used_bytes` | Gauge | Heap memory currently in use |
| `nodejs_heap_size_total_bytes` | Gauge | Total heap allocated |
| `nodejs_external_memory_bytes` | Gauge | External (C++) memory |
| `nodejs_gc_duration_seconds` | Histogram | Garbage collection duration |
| `process_cpu_seconds_total` | Counter | CPU time consumed |
| `process_resident_memory_bytes` | Gauge | RSS memory usage |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |
| `nodejs_active_handles_total` | Gauge | Open file handles |
| `up` | Gauge | 1 if service is up, 0 if down |

---

## Writing PromQL Queries

### Basic Examples

```promql
# Request rate for order-service (last 1 minute)
rate(http_requests_total{service="order-service"}[1m])

# Error rate percentage for all services
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
  / sum(rate(http_requests_total[5m])) * 100

# 95th percentile response time for product-service
histogram_quantile(0.95, 
  sum(rate(http_request_duration_ms_bucket{service="product-service"}[5m])) 
  by (le)
)

# Memory usage per service in MB
nodejs_heap_size_used_bytes / 1024 / 1024

# CPU usage per service
rate(process_cpu_seconds_total[1m])

# Services currently down
up == 0

# Total requests in the last hour
increase(http_requests_total[1h])

# Top 5 slowest routes across all services
topk(5, 
  histogram_quantile(0.95,
    sum(rate(http_request_duration_ms_bucket[5m])) by (route, le)
  )
)
```

### Useful Aggregations

```promql
# Requests per service (table view)
sum by (service) (rate(http_requests_total[5m]))

# Error count per service per minute
sum by (service) (rate(http_requests_total{status_code=~"[45].."}[1m]))

# Average response time per route
sum by (route) (rate(http_request_duration_ms_sum[5m]))
  / sum by (route) (rate(http_request_duration_ms_count[5m]))
```

---

## Writing LogQL Queries

### Basic Examples

```logql
# All logs from order-service
{service="order-service"}

# Error logs across all services
{app="ecommerce-microservices"} |= "error"

# Logs containing "payment" from last 15 minutes
{app="ecommerce-microservices"} |= "payment"

# Filter by log level
{app="ecommerce-microservices"} | json | level="error"

# Count errors per service per minute
sum by (service) (
  rate({app="ecommerce-microservices"} |= "error" [1m])
)

# User service auth events
{service="user-service"} |= "login" or {service="user-service"} |= "register"

# Order confirmation events
{service="order-service"} |= "CONFIRMED"

# Slow query detection (over 1 second)
{app="ecommerce-microservices"} | json | duration > 1000
```

---

## Adding Metrics to a New Service

If you add a new NestJS microservice, follow these steps:

### Step 1 — Install prom-client

```bash
cd services/your-new-service
npm install prom-client --save
```

### Step 2 — Update `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Prometheus Metrics Setup ──────────────────────────────────────────────
  const SERVICE_NAME = 'your-new-service';
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
  // ── End Metrics ───────────────────────────────────────────────────────────

  const port = process.env.PORT || 3007;
  await app.listen(port);
}
bootstrap();
```

### Step 3 — Add to Prometheus Config

Edit `monitoring/prometheus/prometheus.yml` and add:

```yaml
  - job_name: 'your-new-service'
    static_configs:
      - targets: ['your-new-service:3007']
        labels:
          service: 'your-new-service'
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### Step 4 — Reload Prometheus

```bash
curl -X POST http://localhost:9090/-/reload
```

---

## Alerting Setup

Grafana supports alerting via email, Slack, PagerDuty, and more.

### Create an Alert Rule (Grafana UI)

1. Open a panel → click **Edit**
2. Go to **Alert** tab
3. Click **Create alert rule**
4. Set condition, e.g.:
   - **WHEN** `avg()` of `rate(http_requests_total{status_code=~"5.."}[5m])` **IS ABOVE** `0.1`
5. Set evaluation interval: `1m`
6. Add notification channel (email/Slack)

### Common Alert Rules to Configure

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | 5xx rate > 5% | Critical |
| High Response Time | p95 > 2000ms | Warning |
| Service Down | `up == 0` | Critical |
| High Memory | Heap > 400MB | Warning |
| High CPU | CPU > 80% | Warning |

### Configure Email Notifications

Edit `monitoring/grafana/grafana.ini` and add:

```ini
[smtp]
enabled = true
host = smtp.gmail.com:587
user = your-email@gmail.com
password = your-app-password
from_address = your-email@gmail.com
from_name = MicroCart Alerts
```

---

## Troubleshooting

### Prometheus target shows DOWN

```bash
# Check the service is running and metrics endpoint is accessible
docker exec prometheus wget -qO- http://user-service:3001/metrics | head -20

# Check Prometheus logs
docker compose logs prometheus --tail=30
```

### Grafana dashboard shows "No data"

1. Check Prometheus targets: http://localhost:9090/targets
2. Verify datasource connection: **Settings → Data Sources → Test**
3. Ensure time range is correct (try "Last 5 minutes")
4. Check if the service has received any HTTP traffic

### Loki not showing logs

```bash
# Check Promtail is reading logs
docker compose logs promtail --tail=20

# Check Loki is receiving data
curl http://localhost:3100/loki/api/v1/labels

# Verify Docker socket is accessible
docker exec promtail ls /var/run/docker.sock
```

### Service /metrics returns 404

- Ensure `prom-client` is installed: `npm list prom-client` in the service directory
- Check `main.ts` has the metrics middleware added before `app.listen()`
- Rebuild the service container: `docker compose up -d --build service-name`

### High memory usage from monitoring

```bash
# Check container resource usage
docker stats prometheus grafana loki promtail --no-stream

# Typical resource usage:
# Prometheus: ~100-200MB RAM
# Grafana:    ~50-100MB RAM  
# Loki:       ~50-100MB RAM
# Promtail:   ~20-40MB RAM
```

---

## File Structure

```
monitoring/
├── prometheus/
│   └── prometheus.yml              # Scrape targets config
│
├── grafana/
│   ├── grafana.ini                 # Grafana server settings
│   └── provisioning/
│       ├── datasources/
│       │   └── datasources.yml     # Auto-configure Prometheus & Loki
│       └── dashboards/
│           ├── dashboards.yml      # Dashboard loader config
│           └── microservices.json  # Pre-built monitoring dashboard
│
├── loki/
│   └── loki-config.yml             # Log storage & retention settings
│
├── promtail/
│   └── promtail-config.yml         # Docker log scraping config
│
└── shared/
    └── metrics.ts                  # Shared metrics reference (documentation)
```

### Service Instrumentation Files Modified

| Service | File Modified |
|---------|---------------|
| user-service | `services/user-service/src/main.ts` |
| product-service | `services/product-service/src/main.ts` |
| cart-service | `services/cart-service/src/main.ts` |
| order-service | `services/order-service/src/main.ts` |
| wishlist-service | `services/wishlist-service/src/main.ts` |
| support-service | `services/support-service/src/main.ts` |
| api-gateway | `services/api-gateway/src/main.ts` |

---

## Port Reference

| Container | Port | Purpose |
|-----------|------|---------|
| user-service | 3001 | App + `/metrics` |
| product-service | 3002 | App + `/metrics` |
| cart-service | 3003 | App + `/metrics` |
| order-service | 3004 | App + `/metrics` |
| wishlist-service | 3005 | App + `/metrics` |
| support-service | 3006 | App + `/metrics` |
| api-gateway | 4000 | App + `/metrics` |
| **Prometheus** | **9090** | Metrics DB + UI |
| **Grafana** | **3010** | Dashboards |
| **Loki** | **3100** | Log API (internal) |
| Promtail | — | No external port |

---

*For questions or contributions, refer to the main project README.*
