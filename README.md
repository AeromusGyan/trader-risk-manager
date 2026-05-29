# Trader Risk Manager

**Trader Risk Manager** is a production-ready, highly aesthetic web application built specifically for Indian option traders (NIFTY, BANKNIFTY, FINNIFTY, SENSEX, BANKEX). The primary goal of this application is to assist traders in keeping their emotions under check and enforcing strict mathematical risk parameters before committing to a trade.

It provides pre-trade calculators, interactive contract-based planning, an automated trade checklist validation engine, active psychology guard warnings, and a fully featured offline trading journal with CSV backup options.

---

## 🚀 Core Modules & Features

### 1. Stop Loss Calculator
Allows traders to define their risk threshold and calculates stop loss premium targets instantly:
- **Formula**:
  - $\text{Risk Amount} = \text{Trading Capital} \times \frac{\text{Risk Percentage}}{100}$
  - $\text{Risk Per Unit} = \frac{\text{Risk Amount}}{\text{Quantity}}$
  - $\text{Stop Loss Price} = \text{Entry Price} - \text{Risk Per Unit}$

### 2. Position Size Calculator
Informs traders of the maximum contract quantity they can safely buy to contain risk:
- **Formula**:
  - $\text{Per Unit Risk} = \text{Entry Price} - \text{Stop Loss Price}$
  - $\text{Maximum Quantity} = \frac{\text{Maximum Risk Amount}}{\text{Per Unit Risk}}$

### 3. Risk-Reward Calculator
Computes take-profit targets based on entry price, stop-loss price, and custom R:R ratios (1:1 to 1:4):
- **Formula**:
  - $\text{Risk} = \text{Entry Price} - \text{Stop Loss Price}$
  - $\text{Target Price} = \text{Entry Price} + (\text{Risk} \times \text{Ratio})$

### 4. Trade Planner
A contract-focused trading terminal for Call (CE) and Put (PE) options. It pre-populates default lot sizes for Indian indices, outputs execution-ready checklists, and logs trades into the journal in one click.

### 5. Daily Risk Manager
Enforces daily discipline by monitoring today's cumulative P&L. If the loss threshold is breached (e.g. 2% of capital), it triggers a flashing fullscreen banner: **"STOP TRADING FOR TODAY"**.

### 6. Trading Journal
A complete local ledger containing historical trades. Supports searching, index sorting, status filtering, and CSV import/export to allow spreadsheet backups.

### 7. Performance Dashboard
Pulls metrics from the journal and renders performance parameters:
- **Metrics**: Total Trades, Win Rate %, Average Profit, Average Loss, Largest Win/Loss, and Cumulative P&L.
- **Charts**:
  - **Equity Curve**: Chronological line plot tracking capital growth.
  - **Monthly P&L**: Bar chart showing performance grouped by month.
  - **Win/Loss Distribution**: Pie chart illustrating trade count distributions.

### 8. Trade Validation Engine
Performs pre-entry checklist audits. A trade status is marked as **APPROVED** only if:
- Risk is within limit (Expected Trade Loss $\le$ Max Risk Limit per trade).
- Daily loss limit is not currently breached.
- Risk-Reward ratio $\ge$ 1:2.
- Quantity $\ge$ 1.
- Stop Loss is defined and greater than zero.

### 9. Psychology Guard
Applies behavioural prompts to prevent over-trading and size bloating:
- **High Risk Trade**: Triggered when risking $>2\%$ of capital on a single trade.
- **Oversized Position**: Triggered if the quantity exceeds the calculated maximum allowed size.
- **Trading Not Recommended**: Triggered if the daily loss limit has already been met.

### 10. Option Buying Mode (Beginners)
Simplifies option trading metrics for novice traders. Recommends maximum safe stop-loss premium bounds to prevent capital wipeouts.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Angular 19 (utilizing modern standalone components and reactive Signals).
- **Styling**: Tailwind CSS v4 & Angular Material components (configured with custom typography, dark/light themes, and glassmorphism cards).
- **Charts**: Chart.js (reactively integrated with component lifecycles).
- **Persistence**: Offline `localStorage` configuration.

### Folder Structure
The app adheres to clean architecture principles:
```
src/
 ├── app/
 │   ├── core/                  # Core services, models, and shared utilities
 │   │    ├── models/
 │   │    └── services/         # Settings, Journal, Risk, Theme services
 │   ├── features/              # Feature modules (routing children)
 │   │    ├── dashboard/
 │   │    ├── calculators/
 │   │    ├── trade-planner/
 │   │    ├── trading-journal/
 │   │    └── settings/
 │   ├── shared/                # Common components or pipes
 │   ├── app.component.ts       # Root Entry component
 │   ├── app.config.ts          # Core providers & Animation setups
 │   └── app.routes.ts          # Route mappings
 └── styles.css                 # Global styles, Tailwind imports, Material customizations
```

---

## 💻 Local Setup & Execution

1. **Clone & Open Project**:
   Ensure you have Node.js (v18+) and npm installed. Open the directory in your shell.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm start
   ```
   or
   ```bash
   npx ng serve
   ```
   Open [http://localhost:4200](http://localhost:4200) in your browser to view the application.

4. **Build Production Bundle**:
   To compile and optimize the app for production hosting:
   ```bash
   npm run build
   ```
   The build files will be output to the `dist/trader-risk-manager/browser` directory.

---

## 🗺️ Future Extensibility Roadmap

The codebase has been designed with decoupled service layers, allowing developers to expand operations easily:

1. **Broker APIs Integration (Zerodha Kite / Dhan / Upstox)**:
   - Create an `ApiService` in the `core/services/` layer.
   - Bind execution logs from the Trade Planner to trigger actual API orders (basket orders/bracket orders) using WebSockets.
2. **Live Option Chain & OI Analysis**:
   - Integrate market data feeds to fetch live Option Chain premiums, enabling real-time Stop Loss calculations and PCR (Put-Call Ratio) indicators.
3. **TradingView Charting**:
   - Embed TradingView iframe widgets in the Trade Planner page to view index charts and technical analysis parameters directly.
4. **AI Trade Review**:
   - Connect an LLM API to scan journal logs and notes, providing personalized behavioural reviews and suggesting adjustments to trading habits.
