# ⚡ Ola Charge Tracker

A production-ready, full-stack electric vehicle (EV) charging and electricity cost management platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Firebase (Auth & Firestore)**.

Designed specifically for Ola Electric scooter owners (Ola S1 Pro, S1 Air, S1 X, Roadster) and other electric two-wheeler riders to track charging sessions, grid electricity consumption, true operational costs, and long-term battery performance.

---

## 🚀 Key Features

- **Private & Multi-User Architecture**: Every user registers and accesses their own isolated charging diary and scooter specs via Firebase Authentication and Firestore Security Rules.
- **EV Calculation Engine**:
  - Automatically accounts for thermal and converter charging losses (default 10%).
  - Formulas:
    $$\text{Battery Stored (kWh)} = \frac{\text{Ending \%} - \text{Starting \%}}{100} \times \text{Battery Capacity}$$
    $$\text{Grid Units (kWh)} = \frac{\text{Battery Stored}}{1 - \frac{\text{Charging Loss \%}}{100}}$$
    $$\text{Charging Cost (₹)} = \text{Grid Units} \times \text{Electricity Rate}$$
    $$\text{Cost Per Kilometre} = \frac{\text{Total Cost}}{\text{Distance Travelled}}$$
- **Live Preview Before Saving**: Real-time cost and units estimation as you type or slide battery percentages.
- **Interactive Dashboard**:
  - 7 KPI summary cards (Expenditure, Grid Units, Sessions, Average Cost, Average Added %, Distance, Cost/km).
  - Timeframe filtering: Last 7 days, 30 days, 3 months, 6 months, This year, All time.
  - Interactive Recharts for session costs and grid electricity consumption.
- **History & Records**:
  - Search, filter, and sort by date or cost.
  - Edit and delete charging records.
  - Export to **CSV** and **Excel (.xlsx)** with one click.
  - Responsive layout (data table on desktop, cards on mobile).
- **Analytics & Intelligence**:
  - Monthly spending and electricity trends.
  - Smart insight benchmarks (e.g. *"Your average charging cost this month is ₹X"*).
  - Highest and lowest cost sessions.
- **PWA Ready**:
  - Web app manifest and service worker included for native-like installation on mobile and desktop.
- **Theme Support**:
  - Dark Navy & Electric Green theme, Light theme, and System theme.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, Server & Client Components) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Custom EV Color Palette |
| **UI Components** | Radix UI + Custom Accessible Components |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Authentication** | Firebase Authentication (Email/Password & Google Sign-In) |
| **Database** | Google Cloud Firestore (NoSQL) |
| **Spreadsheet Export** | SheetJS (xlsx) |
| **Notifications** | Sonner |
| **PWA** | Manifest v2 + Service Worker |

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 🔒 Firestore Security Rules

Deploy the rules from `firestore.rules` to your Firebase project:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /scooters/{scooterId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /chargingSessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚢 Vercel Deployment

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. In the **Environment Variables** section, add all `NEXT_PUBLIC_FIREBASE_*` variables from your `.env.local`.
5. Click **Deploy**. Vercel will build and assign an SSL-enabled production domain.

---

## 🛵 Default Configuration Presets

Pre-configured defaults for the **Ola S1 Pro Gen 2**:
- **Battery Capacity**: 4.0 kWh
- **Electricity Rate**: ₹12.00 / unit (kWh)
- **Charging Loss**: 10%
- Modifying settings in the app saves to new sessions while strictly preserving historical calculation inputs.
