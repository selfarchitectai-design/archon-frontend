#!/usr/bin/env python3
"""
ARCHON Compact Federation - Telemetry Collector
Version: 2.5.1
Purpose: Collect, store, and analyze build telemetry data

This module:
1. Collects metrics from build processes
2. Stores data in SQLite database
3. Provides analytics and reporting
4. Triggers learning feedback loop
"""

import json
import sqlite3
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class TelemetryRecord:
    """Represents a telemetry record"""
    id: Optional[int]
    timestamp: str
    decision_id: Optional[str]
    build_status: str
    latency_ms: float
    token_usage: int
    cost_usd: float
    error_count: int
    metadata: Dict[str, Any]


class TelemetryCollector:
    """
    ARCHON Telemetry Collector
    Collects and manages build metrics
    """
    
    def __init__(self, db_path: str = "memory_store.sqlite"):
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database with required tables"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Main telemetry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                decision_id TEXT,
                build_status TEXT NOT NULL,
                latency_ms REAL DEFAULT 0,
                token_usage INTEGER DEFAULT 0,
                cost_usd REAL DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # AI performance tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ai_id TEXT NOT NULL,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                avg_latency_ms REAL DEFAULT 0,
                total_cost_usd REAL DEFAULT 0
            )
        """)
        
        # Daily metrics aggregation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_metrics (
                date TEXT PRIMARY KEY,
                total_builds INTEGER DEFAULT 0,
                successful_builds INTEGER DEFAULT 0,
                failed_builds INTEGER DEFAULT 0,
                avg_latency_ms REAL DEFAULT 0,
                total_cost_usd REAL DEFAULT 0,
                total_errors INTEGER DEFAULT 0
            )
        """)
        
        # AI weights table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_weights (
                ai_id TEXT PRIMARY KEY,
                weight REAL NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Create indexes for common queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp 
            ON telemetry(timestamp)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_telemetry_decision 
            ON telemetry(decision_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_telemetry_status 
            ON telemetry(build_status)
        """)
        
        conn.commit()
        conn.close()
    
    def collect(self, data: Dict[str, Any]) -> int:
        """
        Collect telemetry data
        
        Args:
            data: Telemetry data dict
            
        Returns:
            ID of inserted record
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        timestamp = data.get('timestamp', datetime.now(timezone.utc).isoformat())
        
        cursor.execute("""
            INSERT INTO telemetry 
            (timestamp, decision_id, build_status, latency_ms, 
             token_usage, cost_usd, error_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            timestamp,
            data.get('decision_id'),
            data.get('build_status', 'unknown'),
            data.get('latency_ms', 0),
            data.get('token_usage', 0),
            data.get('cost_usd', 0),
            data.get('error_count', 0),
            json.dumps(data.get('metadata', {}))
        ))
        
        record_id = cursor.lastrowid
        conn.commit()
        
        # Update daily metrics
        self._update_daily_metrics(conn, data)
        
        conn.close()
        
        print(f"📊 Telemetry collected: {record_id}")
        return record_id
    
    def _update_daily_metrics(self, conn: sqlite3.Connection, data: Dict):
        """Update daily aggregated metrics"""
        cursor = conn.cursor()
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        # Check if entry exists for today
        cursor.execute("SELECT * FROM daily_metrics WHERE date = ?", (today,))
        exists = cursor.fetchone() is not None
        
        if exists:
            # Update existing record
            is_success = data.get('build_status') == 'success'
            cursor.execute("""
                UPDATE daily_metrics SET
                    total_builds = total_builds + 1,
                    successful_builds = successful_builds + ?,
                    failed_builds = failed_builds + ?,
                    avg_latency_ms = (avg_latency_ms * total_builds + ?) / (total_builds + 1),
                    total_cost_usd = total_cost_usd + ?,
                    total_errors = total_errors + ?
                WHERE date = ?
            """, (
                1 if is_success else 0,
                0 if is_success else 1,
                data.get('latency_ms', 0),
                data.get('cost_usd', 0),
                data.get('error_count', 0),
                today
            ))
        else:
            # Create new record
            is_success = data.get('build_status') == 'success'
            cursor.execute("""
                INSERT INTO daily_metrics 
                (date, total_builds, successful_builds, failed_builds, 
                 avg_latency_ms, total_cost_usd, total_errors)
                VALUES (?, 1, ?, ?, ?, ?, ?)
            """, (
                today,
                1 if is_success else 0,
                0 if is_success else 1,
                data.get('latency_ms', 0),
                data.get('cost_usd', 0),
                data.get('error_count', 0)
            ))
        
        conn.commit()
    
    def get_recent(self, limit: int = 10) -> List[Dict]:
        """Get recent telemetry records"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, timestamp, decision_id, build_status, 
                   latency_ms, token_usage, cost_usd, error_count, metadata
            FROM telemetry
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        
        records = [
            {
                "id": row[0],
                "timestamp": row[1],
                "decision_id": row[2],
                "build_status": row[3],
                "latency_ms": row[4],
                "token_usage": row[5],
                "cost_usd": row[6],
                "error_count": row[7],
                "metadata": json.loads(row[8]) if row[8] else {}
            }
            for row in cursor.fetchall()
        ]
        
        conn.close()
        return records
    
    def get_daily_stats(self, days: int = 7) -> List[Dict]:
        """Get daily statistics for the past N days"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')
        
        cursor.execute("""
            SELECT date, total_builds, successful_builds, failed_builds,
                   avg_latency_ms, total_cost_usd, total_errors
            FROM daily_metrics
            WHERE date >= ?
            ORDER BY date DESC
        """, (start_date,))
        
        stats = [
            {
                "date": row[0],
                "total_builds": row[1],
                "successful_builds": row[2],
                "failed_builds": row[3],
                "success_rate": row[2] / row[1] if row[1] > 0 else 0,
                "avg_latency_ms": row[4],
                "total_cost_usd": row[5],
                "total_errors": row[6]
            }
            for row in cursor.fetchall()
        ]
        
        conn.close()
        return stats
    
    def get_summary(self) -> Dict[str, Any]:
        """Get overall telemetry summary"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Overall stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as successful,
                AVG(latency_ms) as avg_latency,
                SUM(cost_usd) as total_cost,
                SUM(error_count) as total_errors
            FROM telemetry
        """)
        row = cursor.fetchone()
        
        # Last 24 hours stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as successful
            FROM telemetry
            WHERE timestamp > datetime('now', '-24 hours')
        """)
        recent = cursor.fetchone()
        
        conn.close()
        
        return {
            "total_builds": row[0] or 0,
            "successful_builds": row[1] or 0,
            "success_rate": (row[1] or 0) / (row[0] or 1),
            "avg_latency_ms": row[2] or 0,
            "total_cost_usd": row[3] or 0,
            "total_errors": row[4] or 0,
            "builds_24h": recent[0] or 0,
            "successful_24h": recent[1] or 0,
            "success_rate_24h": (recent[1] or 0) / (recent[0] or 1)
        }
    
    def export_for_r(self, output_path: str = "telemetry_export.csv"):
        """Export telemetry data for R analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, decision_id, build_status, 
                   latency_ms, token_usage, cost_usd, error_count
            FROM telemetry
            ORDER BY timestamp
        """)
        
        output_file = os.path.join(os.path.dirname(__file__), output_path)
        
        with open(output_file, 'w') as f:
            f.write("timestamp,decision_id,build_status,latency_ms,token_usage,cost_usd,error_count\n")
            for row in cursor.fetchall():
                f.write(','.join(str(v) for v in row) + '\n')
        
        conn.close()
        print(f"📁 Exported to {output_file}")
        return output_file
    
    def generate_grafana_dashboard(self) -> Dict[str, Any]:
        """Generate Grafana-compatible dashboard config"""
        return {
            "dashboard": {
                "title": "ARCHON Telemetry Dashboard",
                "panels": [
                    {
                        "title": "Build Success Rate",
                        "type": "gauge",
                        "targets": [{"expr": "archon_build_success_rate"}]
                    },
                    {
                        "title": "Build Latency",
                        "type": "graph",
                        "targets": [{"expr": "archon_build_latency_ms"}]
                    },
                    {
                        "title": "Daily Costs",
                        "type": "graph",
                        "targets": [{"expr": "archon_daily_cost_usd"}]
                    },
                    {
                        "title": "Error Count",
                        "type": "graph",
                        "targets": [{"expr": "archon_error_count"}]
                    }
                ]
            }
        }


def collect_from_file():
    """Collect telemetry from telemetry.json file"""
    collector = TelemetryCollector()
    
    telemetry_file = os.path.join(os.path.dirname(__file__), "telemetry.json")
    
    if os.path.exists(telemetry_file):
        with open(telemetry_file, 'r') as f:
            data = json.load(f)
        
        record_id = collector.collect(data)
        print(f"✅ Collected telemetry from file: {record_id}")
    else:
        print("⚠️ No telemetry.json file found")
    
    # Print summary
    summary = collector.get_summary()
    print("\n📊 Telemetry Summary:")
    print(f"   Total Builds: {summary['total_builds']}")
    print(f"   Success Rate: {summary['success_rate']:.1%}")
    print(f"   Avg Latency: {summary['avg_latency_ms']:.0f}ms")
    print(f"   Total Cost: ${summary['total_cost_usd']:.2f}")


def main():
    """Main entry point"""
    collect_from_file()


if __name__ == "__main__":
    main()
