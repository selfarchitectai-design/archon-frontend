#!/bin/bash
# ============================================
# ARCHON Storage Guardian - Cleanup Engine
# Runs tier-based cleanup actions
# ============================================

set -e

# Configuration
LOG_FILE="/var/log/archon/cleanup_engine.log"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_DB="${POSTGRES_DB:-archon}"
POSTGRES_USER="${POSTGRES_USER:-archon}"
DRY_RUN="${DRY_RUN:-false}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_action() {
    local action=$1
    local tier=$2
    local status=$3
    local bytes_freed=$4
    local duration=$5
    local trigger=$6
    local error_msg=${7:-""}
    
    psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        SELECT log_cleanup_action(
            '${action}', ${tier}, 'auto', '${status}', 
            ${bytes_freed}, ${duration}, '${trigger}', 
            $([ -n "$error_msg" ] && echo \"'${error_msg}'\" || echo "NULL")
        );
    " 2>/dev/null
}

# ============================================
# TIER-2 CLEANUP ACTIONS (Auto, Safe)
# ============================================

cleanup_docker_images() {
    log "🐳 Cleaning unused Docker images..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        docker image prune -a --force --filter "until=24h" --dry-run 2>/dev/null || true
        log "[DRY RUN] Docker image prune"
    else
        docker image prune -a --force --filter "until=24h" 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "docker_image_prune" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

cleanup_docker_builder() {
    log "🐳 Cleaning Docker build cache..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Docker builder prune"
    else
        docker builder prune --force --keep-storage=2GB 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "docker_builder_prune" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

cleanup_journald() {
    log "📋 Cleaning journald logs..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] journalctl --vacuum-time=7d"
    else
        journalctl --vacuum-time=7d --vacuum-size=500M 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "journald_vacuum" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

cleanup_tmp() {
    log "🗑️ Cleaning /tmp files older than 7 days..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        find /tmp -type f -mtime +7 -print 2>/dev/null | head -20
        log "[DRY RUN] tmp cleanup"
    else
        find /tmp -type f -mtime +7 -delete 2>/dev/null || true
        find /var/tmp -type f -mtime +7 -delete 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "tmp_cleanup" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

cleanup_apt() {
    log "📦 Cleaning apt cache..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] apt-get clean"
    else
        apt-get clean 2>/dev/null || true
        apt-get autoremove -y 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "apt_clean" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

cleanup_logs_rotate() {
    log "📄 Forcing log rotation..."
    local start_time=$(date +%s%3N)
    local before=$(df -B1 / | tail -1 | awk '{print $3}')
    
    if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] logrotate force"
    else
        logrotate -f /etc/logrotate.conf 2>/dev/null || true
        
        # Clean old rotated logs
        find /var/log -name "*.gz" -mtime +14 -delete 2>/dev/null || true
        find /var/log -name "*.old" -mtime +7 -delete 2>/dev/null || true
        find /var/log -name "*.[0-9]" -mtime +7 -delete 2>/dev/null || true
    fi
    
    local after=$(df -B1 / | tail -1 | awk '{print $3}')
    local freed=$((before - after))
    [ $freed -lt 0 ] && freed=0
    local duration=$(($(date +%s%3N) - start_time))
    
    log "   Freed: $(numfmt --to=iec $freed)"
    log_action "log_rotation" 2 "success" $freed $duration "scheduled"
    
    echo $freed
}

# ============================================
# TIER-1 CLEANUP ACTIONS (Requires approval)
# ============================================

request_approval() {
    local action=$1
    local description=$2
    local estimated_savings=$3
    
    log "📝 Approval requested: ${action}"
    log "   Description: ${description}"
    log "   Estimated savings: ${estimated_savings}"
    
    # Send Slack notification for approval
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"🔔 *Cleanup Approval Requested*\",
                \"attachments\": [{
                    \"color\": \"warning\",
                    \"fields\": [
                        {\"title\": \"Action\", \"value\": \"${action}\", \"short\": true},
                        {\"title\": \"Estimated Savings\", \"value\": \"${estimated_savings}\", \"short\": true},
                        {\"title\": \"Description\", \"value\": \"${description}\"}
                    ]
                }]
            }" > /dev/null
    fi
    
    # Log pending approval
    psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        INSERT INTO archon_cleanup_logs (action_name, action_tier, action_type, status, trigger_reason)
        VALUES ('${action}', 1, 'approval_requested', 'pending', 'threshold');
    " 2>/dev/null
}

# ============================================
# MAIN CLEANUP ORCHESTRATION
# ============================================

run_cleanup() {
    local trigger=${1:-"scheduled"}
    
    log "============================================"
    log "🧹 ARCHON Cleanup Engine Starting"
    log "   Trigger: ${trigger}"
    log "   Dry Run: ${DRY_RUN}"
    log "============================================"
    
    # Get current disk status
    DISK_PERCENT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
    log "Current disk usage: ${DISK_PERCENT}%"
    
    local total_freed=0
    
    # Check if auto cleanup is enabled
    AUTO_CLEANUP=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT get_feature_flag('auto_cleanup_tier2');" 2>/dev/null | tr -d ' ')
    
    if [ "$AUTO_CLEANUP" != "t" ]; then
        log "⚠️ Auto cleanup disabled, exiting"
        exit 0
    fi
    
    # ============================================
    # TIER-2: Always run (safe actions)
    # ============================================
    log ""
    log "=== TIER-2 Cleanup (Auto, Safe) ==="
    
    freed=$(cleanup_docker_images)
    total_freed=$((total_freed + freed))
    
    freed=$(cleanup_docker_builder)
    total_freed=$((total_freed + freed))
    
    freed=$(cleanup_journald)
    total_freed=$((total_freed + freed))
    
    freed=$(cleanup_tmp)
    total_freed=$((total_freed + freed))
    
    freed=$(cleanup_apt)
    total_freed=$((total_freed + freed))
    
    freed=$(cleanup_logs_rotate)
    total_freed=$((total_freed + freed))
    
    # ============================================
    # WARNING LEVEL (70%+)
    # ============================================
    if [ "$DISK_PERCENT" -ge 70 ]; then
        log ""
        log "=== WARNING Level Cleanup (70%+) ==="
        
        # More aggressive docker cleanup
        if [ "$DRY_RUN" != "true" ]; then
            docker system prune -f 2>/dev/null || true
        fi
    fi
    
    # ============================================
    # CRITICAL LEVEL (80%+)
    # ============================================
    if [ "$DISK_PERCENT" -ge 80 ]; then
        log ""
        log "=== CRITICAL Level Actions (80%+) ==="
        
        # Request approval for Tier-1 actions
        request_approval "n8n_execution_prune" \
            "Delete N8N executions older than 30 days" \
            "~1-2GB"
        
        request_approval "archive_old_logs" \
            "Archive application logs older than 7 days to S3" \
            "~500MB-1GB"
    fi
    
    # ============================================
    # EMERGENCY LEVEL (90%+)
    # ============================================
    if [ "$DISK_PERCENT" -ge 90 ]; then
        log ""
        log "=== 🚨 EMERGENCY Level Actions (90%+) ==="
        
        EMERGENCY_ENABLED=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
            "SELECT get_feature_flag('auto_cleanup_emergency');" 2>/dev/null | tr -d ' ')
        
        if [ "$EMERGENCY_ENABLED" = "t" ]; then
            log "Emergency cleanup enabled, running aggressive actions..."
            
            # Remove all unused docker resources
            if [ "$DRY_RUN" != "true" ]; then
                docker system prune -af --volumes 2>/dev/null || true
            fi
            
            # More aggressive log cleanup
            if [ "$DRY_RUN" != "true" ]; then
                find /var/log -name "*.gz" -delete 2>/dev/null || true
                find /var/log -name "*.old" -delete 2>/dev/null || true
            fi
            
            # Send emergency notification
            if [ -n "$SLACK_WEBHOOK_URL" ]; then
                curl -s -X POST "$SLACK_WEBHOOK_URL" \
                    -H 'Content-Type: application/json' \
                    -d "{\"text\": \"🚨 *EMERGENCY CLEANUP EXECUTED*\nDisk was at ${DISK_PERCENT}%. Aggressive cleanup performed.\"}" > /dev/null
            fi
        else
            log "⚠️ Emergency cleanup disabled, manual intervention required!"
        fi
    fi
    
    # ============================================
    # SUMMARY
    # ============================================
    NEW_DISK_PERCENT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
    
    log ""
    log "============================================"
    log "🧹 Cleanup Summary"
    log "   Total freed: $(numfmt --to=iec $total_freed)"
    log "   Disk before: ${DISK_PERCENT}%"
    log "   Disk after:  ${NEW_DISK_PERCENT}%"
    log "============================================"
}

# ============================================
# ENTRYPOINT
# ============================================

case "${1:-run}" in
    run)
        run_cleanup "scheduled"
        ;;
    emergency)
        run_cleanup "emergency"
        ;;
    dry-run)
        DRY_RUN=true run_cleanup "dry-run"
        ;;
    *)
        echo "Usage: $0 {run|emergency|dry-run}"
        exit 1
        ;;
esac
