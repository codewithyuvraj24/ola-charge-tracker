# ⚡ Ola Charge Tracker

A full-stack, multi-vehicle electric scooter (EV) charging and electricity cost tracker built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Motion**, and **Firebase (Auth & Firestore with offline cache)**.

Designed for Ola Electric scooter riders (S1 Pro, S1 Air, S1 X, Roadster) and other EV two-wheeler owners to measure wall-to-battery energy consumption, tariff costs across home/public chargers, monthly budgets, and real EV-vs-petrol savings.

---

## Key Features

- **Private Multi-User & Multi-Vehicle Garage**: Isolated Firebase Authentication + Cloud Firestore storage with per-user security rules, multiple scooters per account, vehicle switcher, and an aggregated **All Vehicles** view.
- **Wall-to-Battery Telemetry Engine**:
  - Accounts for AC/DC converter and thermal charging loss (default `10%`).
  - Formulas:
    $$\text{Battery Stored (kWh)} = \frac{\text{End \%} - \text{Start \%}}{100} \times \text{Battery Capacity}$$
    $$\text{Grid Units (kWh)} = \frac{\text{Battery Stored}}{1 - \frac{\text{Charging Loss \%}}{100}}$$
    $$\text{Charging Cost} = \text{Grid Units} \times \text{Electricity Rate}$$
- **Interactive Battery Gauge & 1-Tap Quick Log**: Slide SoC percentages live, switch between custom Tariff Presets (*Home Plug*, *Office Free*, *Hypercharger*), and log directly from the Dashboard.
- **Budget & EV-vs-Petrol Economics**: Monthly charging budget progress bar, configurable fuel baseline (`petrolPrice` / `petrolMileage`), real-world efficiency (`km/kWh` & `Wh/km`), equivalent battery cycles, and spend breakdown by charging location.
- **Full History, Bulk Actions & Data Portability**: Search, sort, custom date-range filtering, inline edit/delete, multi-select bulk delete, **CSV Import**, and 1-click **CSV / Excel (`.xlsx`) Export**.
- **5 Built-in App Themes (Zero Flash)**: *Midnight Cobalt* (default), *iOS Porcelain*, *Titanium Amber*, *Alpine Mint*, and *Track Rosso*.
- **PWA & Offline Garage Persistence**: Installable on iOS Safari & Android (`apple-touch-icon.png`, `192x192`, `512x512`) with Firestore local persistence for basements/garages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, TypeScript) |
| **UI & Styling** | Tailwind CSS, `shadcn/ui` (Radix UI), Motion, Lucide React |
| **Charts** | Recharts (`ChartContainer`) |
| **Auth & DB** | Firebase Auth + Cloud Firestore (persistent multi-tab local cache) |
| **Import / Export** | SheetJS (`xlsx`) + RFC-4180 CSV parser |
| **Notifications** | Sonner |

---

## Development & Verification Scripts

```bash
npm run dev        # Start local Next.js dev server
npm run lint       # Run ESLint (next/core-web-vitals)
npm run typecheck  # Run TypeScript compiler checks
npm test           # Run unit tests (node --test)
npm run build      # Create production bundle
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and set your Firebase Web SDK keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Deploy `firestore.rules` to your Firebase project so owner-only authentication and numeric bounds validation are enforced server-side.
