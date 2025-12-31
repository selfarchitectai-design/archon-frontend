"""
ARCHON Storage Guardian - API Lambda
Provides endpoints for storage metrics, cleanup status, and feature flags
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from decimal import Decimal

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'localhost'),
        database=os.environ.get('POSTGRES_DB', 'archon'),
        user=os.environ.get('POSTGRES_USER', 'archon'),
        password=os.environ.get('POSTGRES_PASSWORD', '')
    )

# JSON encoder for Decimal and datetime
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def json_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body, cls=CustomEncoder)
    }

# ============================================
# API HANDLERS
# ============================================

def get_storage_metrics(event, context):
    """Get latest storage metrics"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Latest snapshot
            cur.execute("""
                SELECT * FROM v_storage_latest
            """)
            latest = cur.fetchone()
            
            # Last 24 hours trend
            cur.execute("""
                SELECT 
                    recorded_at,
                    disk_used_percent,
                    growth_bytes_24h
                FROM archon_storage_metrics
                WHERE recorded_at > NOW() - INTERVAL '24 hours'
                ORDER BY recorded_at ASC
            """)
            trend_24h = cur.fetchall()
            
            # Last 7 days summary
            cur.execute("""
                SELECT 
                    DATE(recorded_at) as date,
                    AVG(disk_used_percent) as avg_percent,
                    MAX(disk_used_percent) as max_percent,
                    AVG(growth_bytes_24h) as avg_growth
                FROM archon_storage_metrics
                WHERE recorded_at > NOW() - INTERVAL '7 days'
                GROUP BY DATE(recorded_at)
                ORDER BY date DESC
            """)
            trend_7d = cur.fetchall()
        
        conn.close()
        
        return json_response(200, {
            'success': True,
            'data': {
                'current': dict(latest) if latest else None,
                'trend_24h': [dict(r) for r in trend_24h],
                'trend_7d': [dict(r) for r in trend_7d]
            }
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def get_cleanup_status(event, context):
    """Get cleanup activity summary"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Summary view
            cur.execute("""
                SELECT * FROM v_cleanup_summary
            """)
            summary = cur.fetchall()
            
            # Recent actions
            cur.execute("""
                SELECT 
                    id,
                    executed_at,
                    action_name,
                    action_tier,
                    status,
                    bytes_freed,
                    duration_ms,
                    trigger_reason,
                    error_message
                FROM archon_cleanup_logs
                ORDER BY executed_at DESC
                LIMIT 20
            """)
            recent = cur.fetchall()
            
            # Pending approvals
            cur.execute("""
                SELECT *
                FROM archon_cleanup_logs
                WHERE status = 'pending'
                ORDER BY executed_at DESC
            """)
            pending = cur.fetchall()
            
            # Totals
            cur.execute("""
                SELECT 
                    COUNT(*) as total_runs,
                    SUM(bytes_freed) as total_bytes_freed,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed_count
                FROM archon_cleanup_logs
                WHERE executed_at > NOW() - INTERVAL '7 days'
            """)
            totals = cur.fetchone()
        
        conn.close()
        
        return json_response(200, {
            'success': True,
            'data': {
                'summary': [dict(r) for r in summary],
                'recent_actions': [dict(r) for r in recent],
                'pending_approvals': [dict(r) for r in pending],
                'totals': dict(totals) if totals else {}
            }
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def get_feature_flags(event, context):
    """Get all feature flags"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM v_feature_flags
            """)
            flags = cur.fetchall()
        
        conn.close()
        
        return json_response(200, {
            'success': True,
            'data': {flag['flag_name']: flag for flag in flags}
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def set_feature_flag(event, context):
    """Set a feature flag"""
    try:
        body = json.loads(event.get('body', '{}'))
        flag_name = body.get('flag_name')
        enabled = body.get('enabled', False)
        updated_by = body.get('updated_by', 'api')
        
        if not flag_name:
            return json_response(400, {
                'success': False,
                'error': 'flag_name is required'
            })
        
        # Safety check: prevent enabling vector without explicit confirmation
        if flag_name.startswith('vector_') and enabled:
            confirm = body.get('confirm_vector_enable', False)
            if not confirm:
                return json_response(400, {
                    'success': False,
                    'error': 'Vector flags require confirm_vector_enable=true'
                })
        
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE archon_feature_flags
                SET enabled = %s, updated_at = NOW(), updated_by = %s
                WHERE flag_name = %s
                RETURNING flag_name, enabled
            """, (enabled, updated_by, flag_name))
            result = cur.fetchone()
            conn.commit()
        
        conn.close()
        
        if result:
            return json_response(200, {
                'success': True,
                'data': {
                    'flag_name': result[0],
                    'enabled': result[1]
                }
            })
        else:
            return json_response(404, {
                'success': False,
                'error': f'Flag {flag_name} not found'
            })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def get_alerts(event, context):
    """Get recent alerts"""
    try:
        params = event.get('queryStringParameters', {}) or {}
        limit = int(params.get('limit', 20))
        severity = params.get('severity')
        
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT *
                FROM archon_alerts
                WHERE 1=1
            """
            query_params = []
            
            if severity:
                query += " AND severity = %s"
                query_params.append(severity)
            
            query += " ORDER BY created_at DESC LIMIT %s"
            query_params.append(limit)
            
            cur.execute(query, query_params)
            alerts = cur.fetchall()
            
            # Unacknowledged count
            cur.execute("""
                SELECT COUNT(*) as count
                FROM archon_alerts
                WHERE acknowledged = FALSE
                AND created_at > NOW() - INTERVAL '24 hours'
            """)
            unack = cur.fetchone()
        
        conn.close()
        
        return json_response(200, {
            'success': True,
            'data': {
                'alerts': [dict(a) for a in alerts],
                'unacknowledged_count': unack['count'] if unack else 0
            }
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def get_retention_policies(event, context):
    """Get retention policies"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT *
                FROM archon_retention_policies
                ORDER BY protection_tier, resource_name
            """)
            policies = cur.fetchall()
        
        conn.close()
        
        # Group by tier
        grouped = {0: [], 1: [], 2: []}
        for p in policies:
            tier = p['protection_tier']
            grouped[tier].append(dict(p))
        
        return json_response(200, {
            'success': True,
            'data': {
                'tier_0_critical': grouped[0],
                'tier_1_managed': grouped[1],
                'tier_2_ephemeral': grouped[2]
            }
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


def get_guardian_dashboard(event, context):
    """Get complete dashboard data in one call"""
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Storage
            cur.execute("SELECT * FROM v_storage_latest")
            storage = cur.fetchone()
            
            # Cleanup summary
            cur.execute("SELECT * FROM v_cleanup_summary")
            cleanup = cur.fetchall()
            
            # Feature flags
            cur.execute("SELECT * FROM v_feature_flags")
            flags = cur.fetchall()
            
            # Recent alerts
            cur.execute("""
                SELECT * FROM archon_alerts
                WHERE created_at > NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC
                LIMIT 5
            """)
            alerts = cur.fetchall()
            
            # Cleanup totals
            cur.execute("""
                SELECT 
                    SUM(bytes_freed) as total_freed_7d,
                    COUNT(*) as total_runs_7d,
                    COUNT(*) FILTER (WHERE status = 'failed') as failures_7d
                FROM archon_cleanup_logs
                WHERE executed_at > NOW() - INTERVAL '7 days'
            """)
            cleanup_totals = cur.fetchone()
        
        conn.close()
        
        return json_response(200, {
            'success': True,
            'data': {
                'storage': dict(storage) if storage else None,
                'cleanup_summary': [dict(c) for c in cleanup],
                'cleanup_totals': dict(cleanup_totals) if cleanup_totals else {},
                'feature_flags': {f['flag_name']: f['enabled'] for f in flags},
                'recent_alerts': [dict(a) for a in alerts],
                'vector_status': {
                    'enabled': next((f['enabled'] for f in flags if f['flag_name'] == 'vector_enabled'), False),
                    'write_enabled': next((f['enabled'] for f in flags if f['flag_name'] == 'vector_write_enabled'), False),
                    'search_enabled': next((f['enabled'] for f in flags if f['flag_name'] == 'vector_search_enabled'), False),
                    'items_count': 0,
                    'embeddings_count': 0
                }
            }
        })
        
    except Exception as e:
        return json_response(500, {
            'success': False,
            'error': str(e)
        })


# ============================================
# LAMBDA HANDLER
# ============================================

def handler(event, context):
    """Main Lambda handler with routing"""
    
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    
    routes = {
        ('GET', '/guardian/metrics'): get_storage_metrics,
        ('GET', '/guardian/cleanup'): get_cleanup_status,
        ('GET', '/guardian/flags'): get_feature_flags,
        ('POST', '/guardian/flags'): set_feature_flag,
        ('GET', '/guardian/alerts'): get_alerts,
        ('GET', '/guardian/retention'): get_retention_policies,
        ('GET', '/guardian/dashboard'): get_guardian_dashboard,
        ('GET', '/guardian/health'): lambda e, c: json_response(200, {
            'success': True,
            'service': 'archon-storage-guardian',
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        })
    }
    
    handler_func = routes.get((method, path))
    
    if handler_func:
        return handler_func(event, context)
    else:
        return json_response(404, {
            'success': False,
            'error': f'Route not found: {method} {path}'
        })


# For local testing
if __name__ == '__main__':
    # Test dashboard endpoint
    result = handler({'path': '/guardian/dashboard', 'httpMethod': 'GET'}, None)
    print(json.dumps(json.loads(result['body']), indent=2))
