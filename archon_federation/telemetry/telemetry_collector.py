"""
ARCHON Compact Federation - Telemetry Collector
Version: 2.5.1
Purpose: Collects, stores, and reports build metrics for learning feedback
"""

import json
import sqlite3
import requests
import os
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ARCHON.Telemetry')


class TelemetryCollector:
    """
    Collects and manages telemetry data from build pipeline
    Feeds data to Supervisor for trust weight updates
    """
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Path(__file__).parent / 'memory_store.sqlite'
        self.archon_api = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
        self._init_database()
        logger.info("Telemetry Collector initialized")
    
    def _init_database(self):
        """Initialize SQLite database"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Telemetry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                plan_id TEXT,
                build_status TEXT,
                latency_ms REAL,
                token_cost REAL,
                ai_trust_score REAL,
                error_count INTEGER DEFAULT 0,
                metadata TEXT
            )
        """)
        
        # Metrics aggregation table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metrics_daily (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                total_builds INTEGER DEFAULT 0,
                successful_builds INTEGER DEFAULT 0,
                failed_builds INTEGER DEFAULT 0,
                avg_latency_ms REAL,
                total_token_cost REAL,
                avg_trust_score REAL
            )
        """)
        
        # AI Performance tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ai_id TEXT NOT NULL,
                task_type TEXT,
                success INTEGER,
                latency_ms REAL,
                token_usage INTEGER,
                cost_usd REAL
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info("Database initialized")
    
    def collect_from_file(self, filepath: str = 'telemetry.json') -> Dict[str, Any]:
        """
        Collect telemetry from build output file
        """
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            self.store_telemetry(data)
            logger.info(f"Collected telemetry from {filepath}")
            return data
            
        except FileNotFoundError:
            logger.warning(f"Telemetry file not found: {filepath}")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in telemetry file: {e}")
            return {}
    
    def store_telemetry(self, data: Dict[str, Any]):
        """
        Store telemetry data in SQLite
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO telemetry (timestamp, plan_id, build_status, latency_ms, 
                                   token_cost, ai_trust_score, error_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('timestamp', datetime.now(timezone.utc).isoformat()),
            data.get('plan_id'),
            data.get('build_status', data.get('final_status', 'unknown')),
            data.get('latency_ms', data.get('total_duration', 0) * 1000),
            data.get('token_cost', 0),
            data.get('trust_score', 0.75),
            len(data.get('errors', [])),
            json.dumps(data.get('metrics', {}))
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Stored telemetry for plan: {data.get('plan_id')}")
        
        # Update daily aggregates
        self._update_daily_metrics()
    
    def store_ai_performance(self, ai_id: str, task_type: str, success: bool,
                            latency_ms: float, token_usage: int, cost_usd: float):
        """
        Store individual AI model performance
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO ai_performance (timestamp, ai_id, task_type, success, 
                                        latency_ms, token_usage, cost_usd)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now(timezone.utc).isoformat(),
            ai_id,
            task_type,
            1 if success else 0,
            latency_ms,
            token_usage,
            cost_usd
        ))
        
        conn.commit()
        conn.close()
    
    def _update_daily_metrics(self):
        """
        Update daily aggregated metrics
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now(timezone.utc).date().isoformat()
        
        # Calculate today's aggregates
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN build_status != 'success' THEN 1 ELSE 0 END) as failed,
                AVG(latency_ms) as avg_latency,
                SUM(token_cost) as total_cost,
                AVG(ai_trust_score) as avg_trust
            FROM telemetry
            WHERE DATE(timestamp) = ?
        """, (today,))
        
        row = cursor.fetchone()
        
        cursor.execute("""
            INSERT OR REPLACE INTO metrics_daily 
            (date, total_builds, successful_builds, failed_builds, avg_latency_ms, 
             total_token_cost, avg_trust_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (today, row[0], row[1], row[2], row[3], row[4], row[5]))
        
        conn.commit()
        conn.close()
    
    def get_metrics_summary(self, days: int = 7) -> Dict[str, Any]:
        """
        Get metrics summary for the last N days
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
        
        cursor.execute("""
            SELECT 
                SUM(total_builds) as total_builds,
                SUM(successful_builds) as successful_builds,
                SUM(failed_builds) as failed_builds,
                AVG(avg_latency_ms) as avg_latency,
                SUM(total_token_cost) as total_cost,
                AVG(avg_trust_score) as avg_trust
            FROM metrics_daily
            WHERE date >= ?
        """, (since,))
        
        row = cursor.fetchone()
        conn.close()
        
        total = row[0] or 0
        success = row[1] or 0
        
        return {
            'period_days': days,
            'total_builds': total,
            'successful_builds': success,
            'failed_builds': row[2] or 0,
            'success_rate': success / total if total > 0 else 0,
            'avg_latency_ms': round(row[3] or 0, 2),
            'total_token_cost': round(row[4] or 0, 4),
            'avg_trust_score': round(row[5] or 0.75, 3)
        }
    
    def get_ai_performance_summary(self) -> Dict[str, Any]:
        """
        Get performance summary for each AI model
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                ai_id,
                COUNT(*) as total_tasks,
                AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
                AVG(latency_ms) as avg_latency,
                SUM(token_usage) as total_tokens,
                SUM(cost_usd) as total_cost
            FROM ai_performance
            GROUP BY ai_id
        """)
        
        summary = {}
        for row in cursor.fetchall():
            summary[row[0]] = {
                'total_tasks': row[1],
                'success_rate': round(row[2], 3),
                'avg_latency_ms': round(row[3] or 0, 2),
                'total_tokens': row[4] or 0,
                'total_cost_usd': round(row[5] or 0, 4)
            }
        
        conn.close()
        return summary
    
    def report_to_supervisor(self, telemetry_data: Dict[str, Any]):
        """
        Send telemetry to ARCHON Supervisor API
        """
        try:
            response = requests.post(
                f"{self.archon_api}/api/archon/telemetry",
                json={
                    'event': 'telemetry_report',
                    'source': 'federation_collector',
                    'data': telemetry_data,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                },
                timeout=10
            )
            
            if response.ok:
                logger.info("✅ Telemetry reported to Supervisor")
            else:
                logger.warning(f"Telemetry report failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to report telemetry: {e}")
    
    def generate_dashboard_data(self) -> Dict[str, Any]:
        """
        Generate data for Grafana/metrics dashboard
        """
        return {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'summary': self.get_metrics_summary(7),
            'ai_performance': self.get_ai_performance_summary(),
            'recent_builds': self._get_recent_builds(10)
        }
    
    def _get_recent_builds(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent build records
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, plan_id, build_status, latency_ms, ai_trust_score
            FROM telemetry
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        builds = []
        for row in cursor.fetchall():
            builds.append({
                'timestamp': row[0],
                'plan_id': row[1],
                'status': row[2],
                'latency_ms': row[3],
                'trust_score': row[4]
            })
        
        conn.close()
        return builds


def collect_metrics():
    """
    Main entry point - collect and report metrics
    """
    collector = TelemetryCollector()
    
    # Collect from file if exists
    data = collector.collect_from_file('telemetry.json')
    
    # Generate summary
    summary = collector.get_metrics_summary()
    print(json.dumps(summary, indent=2))
    
    # Report to Supervisor
    if data:
        collector.report_to_supervisor(data)


if __name__ == "__main__":
    collect_metrics()
