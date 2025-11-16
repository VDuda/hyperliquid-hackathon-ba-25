# Vault Health Monitor Pro

A real-time BoringVault monitoring application with GlueX hedging strategies, built for the HyperEVM Hackathon.

## 🎯 Overview

Vault Health Monitor Pro provides comprehensive real-time monitoring of BoringVault health metrics with intelligent anomaly detection and GlueX-powered hedging strategy recommendations. All alerts are delivered in-app via toast notifications and a persistent alert feed.

### Key Features

- ✅ **Real-time Monitoring**: 20-second polling of vault state via Lava RPC
- ✅ **Anomaly Detection**: Automatic detection of TVL drops, low collateral, and high volatility
- ✅ **In-App Alerts**: Toast notifications (Sonner) + persistent alert feed (Zustand + localStorage)
- ✅ **GlueX Integration**: Hedging strategy recommendations for yield optimization
- ✅ **Weekly Reports**: Comprehensive reports with charts and historical analysis
- ✅ **Vercel-Ready**: 100% deployable on Vercel with no external services required

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Blockchain**: Viem 2.x for Hyperliquid via Lava RPC
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand with persist middleware
- **Charts**: Recharts
- **Notifications**: Sonner
- **Styling**: Tailwind CSS
- **UI Components**: Custom components following shadcn/ui patterns
- **Icons**: Lucide React

### Project Structure

```
vault-health-monitor/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard with live polling
│   │   └── report/page.tsx       # Weekly/monthly report
│   ├── api/
│   │   ├── vault/
│   │   │   ├── state/route.ts    # Current vault state
│   │   │   └── history/route.ts  # Historical data (7-30 days)
│   │   ├── anomaly/
│   │   │   └── check/route.ts    # Anomaly detection + GlueX strategies
│   │   └── gluex/
│   │       └── search/route.ts   # Yield opportunity search
│   ├── layout.tsx
│   ├── providers.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── VaultOverview.tsx         # Vault metrics cards
│   ├── TVLChart.tsx              # Time series chart
│   ├── AlertFeed.tsx             # Persistent alert list
│   ├── StrategyCard.tsx          # GlueX hedging strategies
│   └── ui/
│       ├── card.tsx
│       └── button.tsx
├── lib/
│   ├── lava.ts                   # Lava RPC client (viem)
│   ├── gluex.ts                  # GlueX API integration
│   ├── boring.ts                 # BoringVault helpers
│   ├── store.ts                  # Zustand alert store
│   ├── abi.ts                    # BoringVault ABI
│   └── utils.ts                  # Utility functions
└── hooks/
    └── useVaultPolling.ts        # Custom polling hook
```

## 🚀 Quick Start

### Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (for compatibility)

### Installation

```bash
cd submissions/vault-health-monitor

# Install dependencies (already done)
bun install

# Configure environment variables
cp .env.local .env.local.example
# Edit .env.local with your values
```

### Environment Variables

```env
LAVA_RPC_HTTPS=https://rpc.lavanet.xyz
GLUEX_API_KEY=sNA6e6HomANEG3WPDYtIEMCcHBvfUIrX
BORING_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
# Start development server
bun dev

# Open browser
open http://localhost:3000
```

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start
```

## 📊 Features in Detail

### 1. Real-Time Vault Monitoring

- Polls vault state every 20 seconds
- Displays TVL, share price, and collateral ratio
- Shows block number and last update timestamp
- Visual indicators for trends (up/down)

### 2. Anomaly Detection

The system monitors for three types of anomalies:

- **TVL Drop**: Triggers when TVL drops >8% in 1 hour
- **Low Collateral**: Alerts when collateral ratio falls below 1.5
- **High Volatility**: Detects when TVL volatility exceeds 15%

### 3. In-App Alerting

- **Toast Notifications**: Instant pop-up alerts with Sonner
- **Alert Feed**: Persistent sidebar showing last 20 alerts
- **Local Storage**: Alerts survive page refresh via Zustand persist
- **Severity Levels**: High (red), Medium (yellow), Low (blue)

### 4. GlueX Hedging Strategies

When anomalies are detected, the system:
- Queries GlueX Yields API for best opportunities
- Recommends hedging strategies (long/short/neutral)
- Shows expected returns and risk levels
- Links to GlueX vaults for execution

### 5. Weekly Reports

- Comprehensive 30-day analysis
- TVL charts with deposit/withdrawal flows
- Alert history summary
- Actionable recommendations
- Export functionality (PDF/PNG ready)

## 🎯 GlueX Integration (Full Implementation)

### ✅ Requirements Fulfilled

**1. GlueX Yields API** ✅
- Scans `/yield` endpoint for highest APY opportunities
- Filters to whitelisted vaults only (security)
- Triggers automatically on anomaly detection
- Displays top 5 opportunities in dashboard

**2. GlueX Router API** ✅
- Generates reallocation calldata via `/router/v1/route`
- Supports partial fills and MEV protection
- Simulates transactions before execution
- Provides gas estimates and APY gain projections

**3. Whitelisted Vaults** ✅
- Hardcoded allowlist in `lib/whitelist.ts`
- Only GlueX-integrated vaults (Beefy, Yearn, etc.)
- Enforced in BoringVault `manage()` function
- Merkle root verification ready

**4. BoringVault Custody** ✅
- All assets locked in BoringVault contract
- Rebalances via restricted `manage()` hook
- Async requests for pending yields (ERC-7540 compatible)
- No private keys exposed in frontend

### Optimization Flow

1. **Detection**: Anomaly detected (low APY, high volatility)
2. **Search**: Query GlueX Yields API for opportunities
3. **Route**: Generate calldata via GlueX Router API
4. **Simulate**: Test transaction success
5. **Execute**: User signs via WalletConnect
6. **Monitor**: Track new APY and alert

## 🔌 API Endpoints

### GET `/api/vault/state`

Returns current vault state.

**Response:**
```json
{
  "tvlUsd": 1000000,
  "sharePrice": 1.05,
  "collateralRatio": 1.8,
  "timestamp": 1700000000000,
  "block": 12345678
}
```

### GET `/api/vault/history?days=7`

Returns historical time series data.

**Response:**
```json
{
  "data": [
    {
      "timestamp": 1700000000000,
      "tvl": 1000000,
      "deposits": 50000,
      "withdrawals": 20000
    }
  ],
  "days": 7
}
```

### GET `/api/anomaly/check`

Checks for anomalies and returns alerts with strategies.

**Response:**
```json
{
  "id": 1700000000000,
  "type": "TVL_DROP",
  "severity": "high",
  "message": "TVL dropped 8.5% in last hour",
  "strategies": [...],
  "timestamp": 1700000000000,
  "currentState": {...}
}
```

### GET `/api/gluex/search`

Searches for yield opportunities via GlueX API (legacy endpoint).

**Response:**
```json
{
  "opportunities": [
    {
      "vault": "0x...",
      "apy": 12.5,
      "tvl": 5000000,
      "risk": "low",
      "protocol": "GlueX"
    }
  ]
}
```

### GET `/api/gluex/yields`

**New**: Full GlueX Yields API integration with whitelist filtering.

**Parameters:**
- `inputToken` (default: USDC)
- `amount` (default: 1000000)
- `currentApy` (default: 0)

**Response:**
```json
{
  "highest": {
    "vaultAddress": "0x...",
    "apy": 12.5,
    "strategy": "Auto-compounding USDC Farm",
    "protocol": "Beefy Finance",
    "risk": "low",
    "whitelisted": true
  },
  "topOpportunities": [...],
  "count": 5
}
```

### POST `/api/gluex/route`

**New**: Generate reallocation calldata via GlueX Router API.

**Body:**
```json
{
  "inputToken": "USDC",
  "amount": "250000",
  "targetVault": "0x...",
  "currentApy": 8.5
}
```

**Response:**
```json
{
  "quote": {
    "outAmount": "250000",
    "apyGain": 4.0,
    "estimatedGas": 250000,
    "slippage": 0.5,
    "route": ["BoringVault", "GlueX Router", "Beefy Vault"]
  },
  "calldata": "0x...",
  "simulation": {
    "success": true,
    "gas": 250000
  }
}
```

### POST `/api/execute`

**New**: Execute rebalance to highest yield opportunity.

**Body:**
```json
{
  "targetVault": "0x...",
  "calldata": "0x...",
  "amount": "250000"
}
```

**Response:**
```json
{
  "hash": "0x...",
  "success": true,
  "message": "Rebalance executed successfully"
}
```

### GET `/api/execute/prepare`

**New**: Prepare rebalance transaction (get calldata + quote).

**Parameters:**
- `percentage` (default: 20) - Percentage of TVL to rebalance

**Response:**
```json
{
  "opportunity": {...},
  "route": {...},
  "rebalanceAmount": 250000,
  "currentTvl": 1250000,
  "percentage": 20
}
```

## 🎨 UI Components

### VaultOverview

Displays key metrics in card format:
- Total Value Locked
- Share Price
- Collateral Ratio

### TVLChart

Interactive Recharts line chart showing:
- TVL over time
- Deposit activity
- Withdrawal activity

### AlertFeed

Scrollable list of alerts with:
- Color-coded severity
- Timestamp
- Strategy count
- Read/unread status

### StrategyCard

GlueX hedging strategies with:
- Strategy type (long/short/neutral)
- Expected returns
- Risk level
- Target vault address

## 🔧 Configuration

### Thresholds

Adjust anomaly detection thresholds in `app/api/anomaly/check/route.ts`:

```typescript
const THRESHOLDS = {
  tvlDrop: 0.08,        // 8% drop triggers alert
  collateralLow: 1.5,   // Minimum collateral ratio
  volatilityHigh: 0.15, // 15% volatility threshold
};
```

### Polling Intervals

Modify polling intervals in `app/dashboard/page.tsx`:

```typescript
refetchInterval: 20_000, // Vault state: 20 seconds
refetchInterval: 60_000, // Anomaly check: 60 seconds
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Environment Variables on Vercel

Add these in your Vercel project settings:
- `LAVA_RPC_HTTPS`
- `GLUEX_API_KEY`
- `BORING_VAULT_ADDRESS`
- `NEXT_PUBLIC_APP_URL`

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This project was built for the HyperEVM Hackathon. Contributions welcome!

## 🙏 Acknowledgments

- **Lava Network**: High-performance RPC infrastructure
- **GlueX**: Yield optimization and hedging strategies
- **Hyperliquid**: HyperEVM blockchain platform
- **Next.js**: React framework
- **Vercel**: Hosting and deployment

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ for the HyperEVM Hackathon
