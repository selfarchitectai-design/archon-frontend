# 🧠 ARCHON V3.6 Dashboard Upgrade

## Overview

Enterprise-grade AI Command Center dashboard built with Next.js 14 App Router, featuring real-time monitoring, MCP integration, and GPT-5 Controller preparation.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📂 Project Structure

```
archon-dashboard/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main dashboard page
│   ├── providers.tsx           # React Query provider
│   ├── globals.css             # Global styles & ARCHON theme
│   ├── api/
│   │   └── archon/
│   │       └── trust/
│   │           └── route.ts    # GPT-5 Trust API endpoint
│   └── components/
│       ├── SystemOverview.tsx      # 🧠 System metrics overview
│       ├── ArchonHealthMonitor.tsx # 🩺 Health monitoring panel
│       ├── SelfHealConsole.tsx     # ⚙️ Self-heal operations
│       ├── CostPanel.tsx           # 💰 Cost optimization
│       ├── ReportPanel.tsx         # 📊 Reports & analytics
│       ├── MCPToolsPanel.tsx       # 🔌 MCP tools interface
│       ├── VerifyPanel.tsx         # 🔄 Verification loop
│       └── TrustAnalyzer.tsx       # 🧩 GPT-5 trust interface
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README_UPGRADE.md
```

---

## 🔌 N8N Endpoint Integration

### Health & Monitoring
```javascript
// System Health
GET https://n8n.selfarchitectai.com/webhook/archon/health

// Dashboard API
GET https://n8n.selfarchitectai.com/webhook/dashboard-api
```

### Self-Heal Operations
```javascript
// Trigger healing
POST https://n8n.selfarchitectai.com/webhook/archon/heal
Body: { "target": "all", "strategy": "auto" }

// Rollback
POST https://n8n.selfarchitectai.com/webhook/archon/rollback
Body: { "scope": "config", "target": "last_snapshot" }

// Create snapshot
POST https://n8n.selfarchitectai.com/webhook/archon/snapshot
```

### Cost Management
```javascript
// Get costs
GET https://n8n.selfarchitectai.com/webhook/archon/costs

// Trigger optimization
POST https://n8n.selfarchitectai.com/webhook/archon/optimize
```

### Reports
```javascript
// Get report
GET https://n8n.selfarchitectai.com/webhook/archon/report

// Get trends
GET https://n8n.selfarchitectai.com/webhook/archon/trend
```

### Verification
```javascript
// Run verification
POST https://n8n.selfarchitectai.com/webhook/archon/verify
Body: { "target": "all", "mode": "full" }
```

---

## 🔌 MCP Integration

### List Tools
```bash
curl -X POST https://n8n.selfarchitectai.com/webhook/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Call Tool
```bash
curl -X POST https://n8n.selfarchitectai.com/webhook/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "archon_health",
      "arguments": {}
    }
  }'
```

### Available MCP Tools (13)

| Tool | Description | Category |
|------|-------------|----------|
| `archon_health` | Get system health | Health |
| `archon_dashboard` | Get dashboard data | Health |
| `archon_event` | Send event | Decision |
| `archon_decide` | Get decision | Decision |
| `archon_policy` | Check policy | Decision |
| `archon_heal` | Trigger healing | Self-Heal |
| `archon_rollback` | Rollback state | Self-Heal |
| `archon_snapshot` | Create snapshot | Self-Heal |
| `archon_costs` | Get cost analysis | Cost |
| `archon_optimize` | Optimize costs | Cost |
| `archon_report` | Get report | Report |
| `archon_trend` | Get trends | Report |
| `archon_verify` | Run verification | Other |

---

## 🧩 GPT-5 Controller Integration

### Trust API Endpoint

The dashboard exposes `/api/archon/trust` for GPT-5 Controller integration.

#### GET - Fetch Trust Metrics
```bash
curl https://your-domain.vercel.app/api/archon/trust
```

Response:
```json
{
  "trust_score": 0.94,
  "verification_status": "verified",
  "last_check": "2026-01-03T12:00:00Z",
  "metrics": {
    "health_status": "healthy",
    "workflows_active": 8,
    "success_rate": 94,
    "uptime": "99.9%",
    "self_heal_status": "active",
    "alerts_24h": 0
  },
  "trust_level": "HIGH",
  "gpt5_ready": true,
  "api_version": "3.6.0"
}
```

#### POST - Push Trust Updates (from GPT-5)
```bash
curl -X POST https://your-domain.vercel.app/api/archon/trust \
  -H "Content-Type: application/json" \
  -d '{
    "trust_score": 0.96,
    "verification_command": "approve_autonomous",
    "metadata": { "source": "gpt5_controller" }
  }'
```

### Trust Levels

| Level | Score Range | Visual |
|-------|-------------|--------|
| CRITICAL | ≥ 95% | 🟢 Green |
| HIGH | 80-94% | 🟢 Green |
| BUILDING | 60-79% | 🟡 Yellow |
| LOW | < 60% | 🔴 Red |

### GPT-5 Controller Binding

1. Deploy dashboard to Vercel
2. Note your deployment URL
3. Configure GPT-5 Controller to call:
   - `GET /api/archon/trust` - Pull current metrics
   - `POST /api/archon/trust` - Push verification commands

---

## 🎨 Theme Configuration

### Colors
```javascript
archon: {
  bg: '#0b0f12',           // Dark background
  panel: '#111827',        // Panel background
  'panel-light': '#1f2937', // Lighter panel
  accent: '#00ffff',       // Cyan accent
  text: '#e5e7eb',         // Primary text
  'text-dim': '#9ca3af',   // Secondary text
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Yellow
  danger: '#ef4444',       // Red
  purple: '#8b5cf6',       // Purple accent
}
```

### Fonts
- **Display**: Orbitron (headings, metrics)
- **Body**: Inter (text)
- **Code**: IBM Plex Mono (code, values)

---

## ⚡ Features

### Auto-Refresh
- Health data: 30 seconds
- Cost data: 60 seconds
- Trust data: 15 seconds
- MCP tools: 60 seconds

### Live Updates
- React Query manages all data fetching
- Automatic background refetch
- Optimistic UI updates

### Visual Effects
- Framer Motion animations
- Glass morphism panels
- Glow effects on active states
- Grid background pattern

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Environment Variables
No environment variables required - all endpoints are public.

---

## 📡 Endpoints Summary

| Endpoint | Type | Description |
|----------|------|-------------|
| `/archon/health` | GET | System health status |
| `/dashboard-api` | GET | Dashboard metrics |
| `/archon/verify` | POST | Run verification |
| `/webhook/mcp` | POST | MCP protocol |
| `/api/archon/trust` | GET/POST | GPT-5 trust interface |

---

## 🔧 Maintenance

### Adding New Components
1. Create component in `app/components/`
2. Import in `page.tsx`
3. Add to grid layout

### Modifying Theme
1. Update `tailwind.config.ts`
2. Update `globals.css` for custom styles

### Adding MCP Tools
Tools are fetched dynamically from N8N MCP Server - no code changes needed.

---

## 📞 Support

- **N8N Dashboard**: https://n8n.selfarchitectai.com
- **GitHub**: https://github.com/selfarchitectai
- **API Documentation**: This file

---

**ARCHON V3.6** | Enterprise AI Command Center | GPT-5 Ready ✅
