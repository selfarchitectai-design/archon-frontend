# ARCHON Storage Guardian

## Overview

Storage Guardian is ARCHON's autonomous data lifecycle management system. It monitors storage capacity, manages cleanup operations, and prepares the environment for Vector Memory activation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE GUARDIAN                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Metrics    │    │  Cleanup    │    │  Alerts     │     │
│  │  Collector  │───▶│  Engine     │───▶│  Manager    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL (archon)                     │   │
│  │  ┌──────────────────┐  ┌──────────────────┐        │   │
│  │  │ storage_metrics  │  │ cleanup_logs     │        │   │
│  │  │ feature_flags    │  │ alerts           │        │   │
│  │  │ retention_policies│  │ (future: vector) │        │   │
│  │  └──────────────────┘  └──────────────────┘        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Protection Tiers

### Tier 0 - CRITICAL (Never Auto-Delete)
- PostgreSQL business data
- Vector memory tables (future)
- Backups
- Named Docker volumes

### Tier 1 - MANAGED (Retention Policies)
- Metrics data
- N8N executions
- Application logs
- Requires approval for destructive actions

### Tier 2 - EPHEMERAL (Auto-Prune)
- Docker unused images/cache
- System logs (journald)
- Temp files
- APT cache

## Installation

### 1. Database Migration

```bash
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
  -f sql/001_storage_guardian_tables.sql
```

### 2. Setup Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Copy to appropriate location
cp scripts/collect_storage_metrics.sh /opt/archon/
cp scripts/cleanup_engine.sh /opt/archon/
```

### 3. Cron Jobs

```cron
# Collect metrics every 15 minutes
*/15 * * * * /opt/archon/collect_storage_metrics.sh >> /var/log/archon/metrics.log 2>&1

# Run cleanup daily at 3am
0 3 * * * /opt/archon/cleanup_engine.sh run >> /var/log/archon/cleanup.log 2>&1
```

### 4. Environment Variables

```bash
export POSTGRES_HOST=localhost
export POSTGRES_DB=archon
export POSTGRES_USER=archon
export POSTGRES_PASSWORD=your_password
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## API Endpoints

### GET /guardian/dashboard
Returns complete dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "storage": {
      "disk_used_percent": 64,
      "disk_total_bytes": 21474836480,
      "disk_used_bytes": 13743895347,
      "growth_bytes_7d_avg": 268435456,
      "days_to_80_percent": 25,
      "health_status": "healthy"
    },
    "cleanup_totals": {
      "total_freed_7d": 8589934592,
      "total_runs_7d": 14
    },
    "feature_flags": {
      "vector_enabled": false,
      "auto_cleanup_tier2": true
    },
    "vector_status": {
      "enabled": false,
      "items_count": 0
    }
  }
}
```

### GET /guardian/metrics
Returns detailed storage metrics.

### GET /guardian/cleanup
Returns cleanup activity and pending approvals.

### GET /guardian/flags
Returns all feature flags.

### POST /guardian/flags
Update a feature flag.

**Request:**
```json
{
  "flag_name": "auto_cleanup_tier2",
  "enabled": true,
  "updated_by": "admin"
}
```

### GET /guardian/alerts
Returns recent alerts.

### GET /guardian/retention
Returns retention policies grouped by tier.

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `vector_enabled` | false | Master switch for vector layer |
| `vector_write_enabled` | false | Allow writing embeddings |
| `vector_search_enabled` | false | Allow vector search |
| `auto_cleanup_tier2` | true | Auto-run Tier-2 cleanup |
| `auto_cleanup_emergency` | true | Auto-cleanup at 90%+ |
| `storage_alerts_enabled` | true | Send storage alerts |

## Alert Thresholds

| Level | Threshold | Actions |
|-------|-----------|---------|
| WARNING | 70% | Slack notification |
| CRITICAL | 80% | Slack + Email, suggest Tier-1 |
| EMERGENCY | 90% | All channels, auto Tier-2 + aggressive |

## Cleanup Actions

### Tier-2 (Automatic)
```bash
# Docker
docker image prune -a --force --filter "until=24h"
docker builder prune --force --keep-storage=2GB

# Logs
journalctl --vacuum-time=7d --vacuum-size=500M
logrotate -f /etc/logrotate.conf

# System
find /tmp -type f -mtime +7 -delete
apt-get clean
```

### Tier-1 (Requires Approval)
- N8N execution pruning (>30 days)
- Archive old logs to S3
- PostgreSQL VACUUM FULL

## Dashboard Integration

Add to main ARCHON dashboard:

```jsx
import StorageGuardianDashboard from './components/StorageGuardianDashboard';

// In your dashboard's renderPage():
case 'guardian':
  return <StorageGuardianDashboard />;
```

## Vector Memory Preparation

The Guardian keeps Vector Memory tables as Tier-0 (protected):

```sql
-- Future tables (schema ready, disabled)
archon_items         -- Semantic items
archon_embeddings    -- Vector embeddings
archon_embedding_queue -- Async processing
```

### Activation Checklist
- [ ] Disk usage < 70% stable for 7 days
- [ ] Growth rate < 100MB/day
- [ ] Cleanup workflows proven
- [ ] Human approval obtained

### Enable Vector (when ready)
```sql
SELECT set_feature_flag('vector_enabled', true, 'admin');
SELECT set_feature_flag('vector_write_enabled', true, 'admin');
-- Search enabled separately after write is stable
```

## Monitoring

### Key Metrics
- `archon_disk_used_percent` - Primary health indicator
- `archon_disk_growth_bytes_per_day` - Growth trend
- `archon_cleanup_bytes_freed` - Cleanup effectiveness

### Grafana Queries (example)
```promql
# Disk usage trend
archon_disk_used_percent

# Days until 80%
archon_disk_days_to_threshold{threshold="80"}

# Cleanup effectiveness
rate(archon_cleanup_bytes_freed[24h])
```

## Troubleshooting

### High Disk Growth
1. Check `component_breakdown` for largest contributor
2. Review Docker images: `docker images --format "{{.Size}}\t{{.Repository}}"`
3. Check PostgreSQL: `SELECT pg_size_pretty(pg_database_size('archon'))`

### Cleanup Failures
1. Check logs: `tail -100 /var/log/archon/cleanup.log`
2. Review `archon_cleanup_logs` table
3. Run dry-run: `./cleanup_engine.sh dry-run`

### Alerts Not Sending
1. Verify `SLACK_WEBHOOK_URL` is set
2. Check `storage_alerts_enabled` flag
3. Review cooldown in `archon_alerts` table

## Retention Matrix

| Resource | Full | Archive | Action |
|----------|------|---------|--------|
| App logs | 7d | 30d | rotate → compress → delete |
| System logs | 7d | - | vacuum |
| N8N executions | 30d | 90d | archive → delete |
| Metrics (high-res) | 7d | 30d | downsample |
| Vector memory | ∞ | - | NEVER DELETE |

---

**Version:** 1.0.0
**Last Updated:** 2024-12-21
**Author:** ARCHON System
