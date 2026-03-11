# 🤖 QuantBot 2026: Pair Trading Bot

**QuantBot** is a high-frequency pair trading bot built with Next.js, Drizzle ORM, and CCXT. It utilizes statistical arbitrage through Z-Score analysis to identify mean reversion opportunities across various cryptocurrency pairs.

---

## 🌟 Key Features

-   **📈 Real-time Z-Score Monitoring:** Live visualization of statistical spreads and entry/exit thresholds.
-   **🛡️ Risk Management:** Built-in safety locks, slippage protection, and automated stop-loss/take-profit mechanisms.
-   **⚙️ Multi-Exchange Support:** Seamless integration with major exchanges like Binance via the CCXT library.
-   **🧪 Backtest Engine:** Simulate historical performance to optimize your trading parameters before going live.
-   **🔔 AI Market Analysis:** Integrated AI market mood filtering to prevent entries during extreme volatility.
-   **💬 Telegram Alerts:** Instant notifications for every trade execution and system status update.

---

## 🛠️ Technology Stack

-   **Frontend:** Next.js 15 (App Router), TailwindCSS, Lucide-React.
-   **Backend:** Next.js Server Actions & API Routes.
-   **Database:** Neon (Serverless Postgres) with Drizzle ORM.
-   **Trading Engine:** CCXT (CryptoCurrency eXchange Trading Library).
-   **Charts:** Lightweight Charts (by TradingView).

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env.local` file with the following keys:
-   `DATABASE_URL`: Your Neon Database connection string.
-   `BINANCE_API_KEY` & `BINANCE_SECRET`: Your Binance API credentials.
-   `ENCRYPTION_KEY`: A secure 32-character key for API security.
-   `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.

### 3. Database Migration
```bash
npx drizzle-kit push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📖 Detailed Documentation

For a comprehensive guide on how to use the system, the trading logic, and the detailed workflow, please refer to the:

👉 **[GUIDE.md](./GUIDE.md)**

---

## ⚠️ Disclaimer

Trading cryptocurrencies involves significant risk and can result in the loss of your capital. This bot is for educational and experimental purposes. Always backtest and trade with caution.
