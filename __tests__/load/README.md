# Safha Load Tests

Load testing suite using [k6](https://k6.io/) for stress testing Safha's APIs, database, and edge functions.

## Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6

   # Windows
   choco install k6

   # Or download from https://k6.io/docs/getting-started/installation/
   ```

2. **Environment Variables**:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"  # For edge function tests
   export MOYASAR_WEBHOOK_SECRET="your-webhook-secret"       # For webhook tests
   ```

## Test Files

| File | Description | Target |
|------|-------------|--------|
| `feed-load.k6.js` | Feed API performance | REST API |
| `search-load.k6.js` | Search functionality | REST API |
| `webhook-load.k6.js` | Payment webhook handling | Edge Functions |
| `rss-pipeline-load.k6.js` | Content pipeline | Edge Functions |
| `database-stress.k6.js` | Database connection pool | PostgreSQL |

## Running Tests

### Quick Smoke Test
```bash
# Verify everything works with minimal load
k6 run --vus 1 --duration 30s __tests__/load/feed-load.k6.js
```

### Standard Load Test
```bash
# Run with default scenarios
k6 run __tests__/load/feed-load.k6.js
```

### Custom Load Configuration
```bash
# Specify VUs and duration
k6 run --vus 100 --duration 5m __tests__/load/feed-load.k6.js

# With environment variables
k6 run -e BASE_URL=https://your-project.supabase.co __tests__/load/feed-load.k6.js
```

### Running Against Production
```bash
# CAUTION: Only run during low-traffic periods
k6 run -e BASE_URL=https://safha.app -e SUPABASE_ANON_KEY=$PROD_ANON_KEY __tests__/load/feed-load.k6.js
```

### All Tests in Sequence
```bash
# Run all load tests
for test in feed-load search-load webhook-load database-stress; do
  echo "Running $test..."
  k6 run __tests__/load/${test}.k6.js
done
```

## Scenarios

Each test file includes multiple scenarios:

### Feed Load Test
- **feed_load**: Ramping from 0 → 200 VUs over 8 minutes

### Search Load Test
- **search_load**: Ramping from 0 → 100 VUs over 6 minutes

### Webhook Load Test
- **webhook_burst**: Arrival rate test simulating 1-100 webhooks/second

### Database Stress Test
- **read_heavy**: Read-focused stress up to 300 concurrent users
- **write_workload**: Write operations up to 50 concurrent users
- **mixed**: Realistic 80/20 read/write mix up to 150 concurrent users

## Thresholds

Tests will fail if these thresholds are exceeded:

| Metric | Threshold |
|--------|-----------|
| `http_req_duration` | p(95) < 500ms, p(99) < 1000ms |
| `http_req_failed` | rate < 1% |
| `feed_load_time` | p(95) < 400ms |
| `search_latency` | p(95) < 700ms |
| `webhook_latency` | p(95) < 800ms |

## Output and Reports

### Console Output
```bash
k6 run --summary-trend-stats "avg,min,med,max,p(90),p(95),p(99)" __tests__/load/feed-load.k6.js
```

### JSON Output
```bash
k6 run --out json=results.json __tests__/load/feed-load.k6.js
```

### InfluxDB (for Grafana dashboards)
```bash
k6 run --out influxdb=http://localhost:8086/k6 __tests__/load/feed-load.k6.js
```

### Cloud Results (k6 Cloud)
```bash
k6 cloud __tests__/load/feed-load.k6.js
```

## Interpreting Results

### Key Metrics to Watch

1. **http_req_duration**: Response time
   - p(95) < 500ms = Good
   - p(95) > 1000ms = Needs optimization

2. **http_req_failed**: Error rate
   - < 1% = Good
   - > 5% = Critical issue

3. **vus**: Virtual users
   - Watch for capacity limits

4. **data_received/sent**: Bandwidth usage

### Common Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| High p(99) with low p(50) | Connection pool saturation | Increase pool size |
| Increasing errors at high VUs | Rate limiting | Add request queuing |
| Timeouts in edge functions | AI API slowness | Add timeout handling |
| Slow search at scale | Missing indexes | Add pg_trgm indexes |

## CI/CD Integration

### GitHub Actions
```yaml
- name: Load Test
  run: |
    k6 run --vus 10 --duration 30s __tests__/load/feed-load.k6.js
```

### Pre-deployment Check
```yaml
- name: Smoke Test
  run: |
    k6 run --vus 1 --duration 10s __tests__/load/feed-load.k6.js
```

## Best Practices

1. **Never run stress tests against production without warning**
2. **Start with smoke tests** before ramping up
3. **Monitor database connections** during tests
4. **Run during low-traffic periods** if testing production
5. **Save baseline results** for comparison
6. **Test after every major change** to catch regressions
