# ⚡ Ola Charge Tracker

A full-stack, multi-vehicle electric scooter (EV) charging and electricity cost tracker built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Motion**, and **Firebase (Auth & Firestore with offline persistence)**.

Built for Ola Electric riders (S1 Pro, S1 Air, S1 X, Roadster) and other EV two-wheeler owners to measure wall-to-battery energy consumption, electricity costs across home/public chargers, monthly charging budgets, and real EV-vs-petrol savings.

---

## Key Features

- **Private Multi-User & Multi-Vehicle Garage**: Isolated Firebase Authentication and Cloud Firestore storage with owner-only security rules, multiple scooters per account, instant garage switcher, and an aggregated **All Vehicles** view.
- **Wall-to-Battery Telemetry Engine**:
  - Accounts for AC/DC converter and thermal charging loss (default `10%`).
  - Core formulas:
    $$\text{Battery Stored (kWh)} = \frac{\text{End \%} - \text{Start \%}}{100} \times \text{Battery Capacity}$$
    $$\text{Grid Units (kWh)} = \frac{\text{Battery Stored}}{1 - \frac{\text{Charging Loss \%}}{100}}$$
    $$\text{Charging Cost} = \text{Grid Units} \times \text{Electricity Rate}$$
- **Interactive Battery Gauge & 1-Tap Quick Log**: Slide SoC percentages live, switch between custom Tariff Presets (*Home Plug*, *Office Free*, *Hypercharger*), and log sessions directly from the Dashboard.
- **Budget & EV-vs-Petrol Economics**: Monthly charging budget tracker, configurable fuel baseline (`petrolPrice` / `petrolMileage`), real-world efficiency (`km/kWh` & `Wh/km`), equivalent full charge cycles, and spend breakdown by charging location.
- **Full History, Bulk Actions & Data Portability**: Search, sort, custom date-range filtering, inline edit/delete, multi-select bulk delete, **CSV Import**, and 1-click **CSV / Excel (`.xlsx`) Export**.
- **5 Built-in App Themes (Zero Flash)**: *Midnight Cobalt* (default), *iOS Porcelain*, *Titanium Amber*, *Alpine Mint*, and *Track Rosso*.
- **PWA & Offline Garage Persistence**: Installable on iOS Safari & Android (`apple-touch-icon.png`, `192x192`, `512x512`) with Firestore multi-tab offline persistence and hardened HTTP security headers.

---

## Project Structure

```text
ola-charge-tracker/
├── app/                        # Next.js App Router pages, layouts & boundaries
│   ├── (auth)/                 # Login, registration & password reset
│   ├── (dashboard)/            # Protected app shell & core workspace routes
│   │   ├── add-session/        # Detailed charging logger with presets & odometer
│   │   ├── analytics/          # Timeframe trends, efficiency & EV-vs-petrol savings
│   │   ├── dashboard/          # Quick Log gauge, budget progress & KPIs
│   │   ├── history/            # Search, filter, edit, bulk delete, CSV/XLSX import & export
│   │   └── settings/           # Garage management, tariff presets, currency & themes
│   ├── onboarding/             # First-run scooter configuration
│   ├── error.tsx               # App-wide runtime error boundary
│   ├── not-found.tsx           # Custom 404 page
│   ├── layout.tsx              # Root metadata, pre-paint theme script & providers
│   └── page.tsx                # Public landing page & interactive simulator
├── components/
│   ├── ev/                     # Domain-specific EV components (VisualBatteryGauge)
│   ├── shared/                 # Theme switcher & Uiverse micro-interaction primitives
│   └── ui/                     # Standard shadcn/ui design-system primitives
├── providers/                  # React Context providers (Auth, Scooter, Theme)
├── lib/                        # Pure calculations, CSV/Excel helpers, Firebase, Firestore & Zod schemas
├── public/                     # Web app manifest, service worker & SVG/PNG PWA icons
├── tests/                      # Automated unit tests (`node --test`)
├── firestore.rules             # Firebase owner-only & schema bounds security rules
└── next.config.mjs             # Next.js config, security headers & SW cache policy
```

---

## Development & Verification

```bash
npm install        # Install dependencies
npm run dev        # Start local Next.js dev server (http://localhost:3000)
npm run lint       # Run ESLint (next/core-web-vitals)
npm run typecheck  # Run TypeScript compiler checks
npm test           # Run automated unit tests (node --test)
npm run build      # Create production bundle
```

---

## Environment Variables & Deployment

1. Copy `.env.example` to `.env.local` and configure your Firebase Web SDK keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

2. Deploy `firestore.rules` in Firebase Console to enforce authenticated per-user access and numeric range checks.
3. Push to GitHub and import into **Vercel** with the same `NEXT_PUBLIC_FIREBASE_*` environment variables set in Project Settings.
