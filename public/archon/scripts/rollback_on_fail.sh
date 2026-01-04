#!/bin/bash
# ARCHON Auto-Rollback Handler
# Triggered when deployment health check fails

VERCEL_TOKEN="${VERCEL_TOKEN}"
PROJECT_ID="prj_OguVxu6oPwGbcIwwEtYq6JkSNj2s"
TEAM_ID="team_1ObevaGr4rOEodjKXBbPrsLN"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Auto-rollback triggered"

# Get last successful deployment
LAST_GOOD=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&teamId=$TEAM_ID&state=READY&limit=2" \
  | jq -r '.deployments[1].uid')

if [ -n "$LAST_GOOD" ] && [ "$LAST_GOOD" != "null" ]; then
  echo "Rolling back to: $LAST_GOOD"
  
  # Promote previous deployment
  curl -X POST "https://api.vercel.com/v1/deployments/$LAST_GOOD/aliases" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"alias": "dashboard.selfarchitectai.com"}'
    
  echo "✅ Rollback complete"
else
  echo "❌ No previous deployment found for rollback"
fi
