#!/bin/bash
# ============================================
# ARCHON Storage Guardian - Metrics Collector
# Collects storage metrics and saves to PostgreSQL
# Run via cron: */15 * * * * /path/to/collect_storage_metrics.sh
# ============================================

set -e

# Configuration
LOG_FILE="/var/log/archon/storage_metrics.log"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_DB="${POSTGRES_DB:-archon}"
POSTGRES_USER="${POSTGRES_USER:-archon}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting Storage Metrics Collection ==="

# ============================================
# 1. DISK METRICS
# ============================================
get_disk_metrics() {
    # Get root filesystem stats
    DISK_INFO=$(df -B1 / | tail -1)
    DISK_TOTAL=$(echo "$DISK_INFO" | awk '{print $2}')
    DISK_USED=$(echo "$DISK_INFO" | awk '{print $3}')
    DISK_AVAILABLE=$(echo "$DISK_INFO" | awk '{print $4}')
    DISK_PERCENT=$(echo "$DISK_INFO" | awk '{print $5}' | tr -d '%')
    
    log "Disk: ${DISK_PERCENT}% used (${DISK_USED} / ${DISK_TOTAL})"
}

# ============================================
# 2. DOCKER METRICS
# ============================================
get_docker_metrics() {
    if command -v docker &> /dev/null; then
        # Images size
        DOCKER_IMAGES=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1 || echo "0")
        DOCKER_IMAGES_BYTES=$(numfmt --from=iec "$DOCKER_IMAGES" 2>/dev/null || echo "0")
        
        # Build cache
        DOCKER_CACHE=$(docker system df --format '{{.Size}}' 2>/dev/null | sed -n '2p' || echo "0")
        DOCKER_CACHE_BYTES=$(numfmt --from=iec "$DOCKER_CACHE" 2>/dev/null || echo "0")
        
        # Volumes
        DOCKER_VOLUMES=$(docker system df --format '{{.Size}}' 2>/dev/null | sed -n '3p' || echo "0")
        DOCKER_VOLUMES_BYTES=$(numfmt --from=iec "$DOCKER_VOLUMES" 2>/dev/null || echo "0")
        
        DOCKER_TOTAL=$((DOCKER_IMAGES_BYTES + DOCKER_CACHE_BYTES + DOCKER_VOLUMES_BYTES))
        
        log "Docker: Images=${DOCKER_IMAGES}, Cache=${DOCKER_CACHE}, Volumes=${DOCKER_VOLUMES}"
    else
        DOCKER_IMAGES_BYTES=0
        DOCKER_CACHE_BYTES=0
        DOCKER_VOLUMES_BYTES=0
        DOCKER_TOTAL=0
        log "Docker: Not installed"
    fi
}

# ============================================
# 3. LOGS METRICS
# ============================================
get_logs_metrics() {
    # App logs
    LOGS_APP=0
    if [ -d "/var/log/archon" ]; then
        LOGS_APP=$(du -sb /var/log/archon 2>/dev/null | cut -f1 || echo "0")
    fi
    
    # System logs (journald)
    LOGS_SYSTEM=0
    if [ -d "/var/log/journal" ]; then
        LOGS_SYSTEM=$(du -sb /var/log/journal 2>/dev/null | cut -f1 || echo "0")
    fi
    
    # Nginx logs
    LOGS_NGINX=0
    if [ -d "/var/log/nginx" ]; then
        LOGS_NGINX=$(du -sb /var/log/nginx 2>/dev/null | cut -f1 || echo "0")
    fi
    
    LOGS_TOTAL=$((LOGS_APP + LOGS_SYSTEM + LOGS_NGINX))
    
    log "Logs: App=${LOGS_APP}, System=${LOGS_SYSTEM}, Nginx=${LOGS_NGINX}"
}

# ============================================
# 4. POSTGRESQL METRICS
# ============================================
get_postgres_metrics() {
    # Total database size
    PG_TOTAL=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT pg_database_size('$POSTGRES_DB');" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Table sizes (top tables)
    PG_TABLES=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -F',' -c \
        "SELECT relname, pg_total_relation_size(relid) 
         FROM pg_stat_user_tables 
         ORDER BY pg_total_relation_size(relid) DESC 
         LIMIT 10;" 2>/dev/null || echo "")
    
    # Format as JSON
    PG_TABLES_JSON="{"
    while IFS=',' read -r table size; do
        if [ -n "$table" ]; then
            PG_TABLES_JSON="${PG_TABLES_JSON}\"${table}\":${size},"
        fi
    done <<< "$PG_TABLES"
    PG_TABLES_JSON="${PG_TABLES_JSON%,}}"
    
    log "PostgreSQL: Total=${PG_TOTAL} bytes"
}

# ============================================
# 5. N8N METRICS
# ============================================
get_n8n_metrics() {
    # N8N data directory
    N8N_DATA=0
    if [ -d "/home/node/.n8n" ]; then
        N8N_DATA=$(du -sb /home/node/.n8n 2>/dev/null | cut -f1 || echo "0")
    fi
    
    # N8N executions from database (if using postgres)
    N8N_EXECUTIONS=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT COALESCE(pg_total_relation_size('execution_entity'), 0);" 2>/dev/null | tr -d ' ' || echo "0")
    
    log "N8N: Data=${N8N_DATA}, Executions=${N8N_EXECUTIONS}"
}

# ============================================
# 6. CALCULATE GROWTH
# ============================================
calculate_growth() {
    # Get 24h old snapshot
    PREV_USED=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT disk_used_bytes FROM archon_storage_metrics 
         WHERE recorded_at < NOW() - INTERVAL '24 hours' 
         ORDER BY recorded_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ -n "$PREV_USED" ] && [ "$PREV_USED" != "0" ]; then
        GROWTH_24H=$((DISK_USED - PREV_USED))
    else
        GROWTH_24H=0
    fi
    
    # Get 7-day average
    GROWTH_7D_AVG=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT COALESCE(AVG(growth_bytes_24h), 0)::BIGINT 
         FROM archon_storage_metrics 
         WHERE recorded_at > NOW() - INTERVAL '7 days';" 2>/dev/null | tr -d ' ' || echo "0")
    
    log "Growth: 24h=${GROWTH_24H}, 7d_avg=${GROWTH_7D_AVG}"
}

# ============================================
# 7. CALCULATE DAYS TO THRESHOLD
# ============================================
calculate_projections() {
    if [ "$GROWTH_7D_AVG" -gt 0 ]; then
        BYTES_TO_70=$((DISK_TOTAL * 70 / 100 - DISK_USED))
        BYTES_TO_80=$((DISK_TOTAL * 80 / 100 - DISK_USED))
        BYTES_TO_90=$((DISK_TOTAL * 90 / 100 - DISK_USED))
        
        if [ "$BYTES_TO_70" -gt 0 ]; then
            DAYS_TO_70=$((BYTES_TO_70 / GROWTH_7D_AVG))
        else
            DAYS_TO_70=0
        fi
        
        if [ "$BYTES_TO_80" -gt 0 ]; then
            DAYS_TO_80=$((BYTES_TO_80 / GROWTH_7D_AVG))
        else
            DAYS_TO_80=0
        fi
        
        if [ "$BYTES_TO_90" -gt 0 ]; then
            DAYS_TO_90=$((BYTES_TO_90 / GROWTH_7D_AVG))
        else
            DAYS_TO_90=0
        fi
    else
        DAYS_TO_70=999
        DAYS_TO_80=999
        DAYS_TO_90=999
    fi
    
    log "Projections: 70%=${DAYS_TO_70}d, 80%=${DAYS_TO_80}d, 90%=${DAYS_TO_90}d"
}

# ============================================
# 8. BUILD JSON & INSERT
# ============================================
insert_metrics() {
    # Build component breakdown JSON
    COMPONENT_JSON=$(cat <<EOF
{
    "docker": {
        "images": ${DOCKER_IMAGES_BYTES:-0},
        "volumes": ${DOCKER_VOLUMES_BYTES:-0},
        "cache": ${DOCKER_CACHE_BYTES:-0},
        "total": ${DOCKER_TOTAL:-0}
    },
    "postgres": {
        "total": ${PG_TOTAL:-0},
        "tables": ${PG_TABLES_JSON:-{}}
    },
    "logs": {
        "app": ${LOGS_APP:-0},
        "system": ${LOGS_SYSTEM:-0},
        "nginx": ${LOGS_NGINX:-0},
        "total": ${LOGS_TOTAL:-0}
    },
    "n8n": {
        "data": ${N8N_DATA:-0},
        "executions": ${N8N_EXECUTIONS:-0}
    },
    "vector": {
        "items": 0,
        "embeddings": 0,
        "index": 0
    }
}
EOF
)

    # Insert into database
    psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO archon_storage_metrics (
            disk_total_bytes,
            disk_used_bytes,
            disk_available_bytes,
            disk_used_percent,
            component_breakdown,
            growth_bytes_24h,
            growth_bytes_7d_avg,
            days_to_70_percent,
            days_to_80_percent,
            days_to_90_percent
        ) VALUES (
            ${DISK_TOTAL},
            ${DISK_USED},
            ${DISK_AVAILABLE},
            ${DISK_PERCENT},
            '${COMPONENT_JSON}'::jsonb,
            ${GROWTH_24H:-0},
            ${GROWTH_7D_AVG:-0},
            ${DAYS_TO_70:-999},
            ${DAYS_TO_80:-999},
            ${DAYS_TO_90:-999}
        );
    " 2>/dev/null
    
    log "Metrics inserted successfully"
}

# ============================================
# 9. CHECK ALERTS
# ============================================
check_alerts() {
    # Check if alerts are enabled
    ALERTS_ENABLED=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT get_feature_flag('storage_alerts_enabled');" 2>/dev/null | tr -d ' ')
    
    if [ "$ALERTS_ENABLED" != "t" ]; then
        log "Alerts disabled, skipping"
        return
    fi
    
    # Determine severity
    if [ "$DISK_PERCENT" -ge 90 ]; then
        SEVERITY="emergency"
        ALERT_TYPE="disk_emergency"
        MESSAGE="🚨 EMERGENCY: Disk at ${DISK_PERCENT}%! Immediate action required."
    elif [ "$DISK_PERCENT" -ge 80 ]; then
        SEVERITY="critical"
        ALERT_TYPE="disk_critical"
        MESSAGE="🔴 CRITICAL: Disk at ${DISK_PERCENT}%. ${DAYS_TO_90} days to 90%."
    elif [ "$DISK_PERCENT" -ge 70 ]; then
        SEVERITY="warning"
        ALERT_TYPE="disk_warning"
        MESSAGE="⚠️ WARNING: Disk at ${DISK_PERCENT}%. ${DAYS_TO_80} days to 80%."
    else
        log "Disk healthy at ${DISK_PERCENT}%, no alert needed"
        return
    fi
    
    # Check cooldown
    SHOULD_SEND=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT should_send_alert('${ALERT_TYPE}', 60);" 2>/dev/null | tr -d ' ')
    
    if [ "$SHOULD_SEND" = "t" ]; then
        # Send to Slack
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -s -X POST "$SLACK_WEBHOOK_URL" \
                -H 'Content-Type: application/json' \
                -d "{\"text\": \"${MESSAGE}\"}" > /dev/null
            log "Alert sent to Slack: ${ALERT_TYPE}"
        fi
        
        # Log alert
        psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            INSERT INTO archon_alerts (alert_type, severity, message, metric_value, threshold_value, channels_notified)
            VALUES ('${ALERT_TYPE}', '${SEVERITY}', '${MESSAGE}', ${DISK_PERCENT}, 
                    CASE WHEN '${SEVERITY}' = 'warning' THEN 70 
                         WHEN '${SEVERITY}' = 'critical' THEN 80 
                         ELSE 90 END,
                    ARRAY['slack']);
        " 2>/dev/null
    else
        log "Alert ${ALERT_TYPE} in cooldown, skipping"
    fi
}

# ============================================
# MAIN EXECUTION
# ============================================
main() {
    get_disk_metrics
    get_docker_metrics
    get_logs_metrics
    get_postgres_metrics
    get_n8n_metrics
    calculate_growth
    calculate_projections
    insert_metrics
    check_alerts
    
    log "=== Storage Metrics Collection Complete ==="
}

# Run
main
