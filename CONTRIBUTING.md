# Contributing to Ola Charge Tracker

Thank you for helping improve **Ola Charge Tracker**!

## Getting Started

1. Fork the repository and clone your fork locally.
2. Copy `.env.example` to `.env.local` and configure your Firebase Web SDK keys.
3. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Project Conventions

- **Components**: Place standard `shadcn/ui` primitives in `components/ui/`, EV domain widgets in `components/ev/`, and shared UI components in `components/shared/`.
- **State & Context**: Keep React Context providers inside `providers/`.
- **Business Logic**: Keep pure calculations, validation schemas, CSV helpers, and Firebase helpers inside `lib/`.
- **Styling**: Use semantic Tailwind + CSS variables defined in `app/globals.css` so all 5 built-in themes work consistently.

## Before Opening a Pull Request

Make sure all quality checks pass locally:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Keep commits focused and never commit `.env.local` or private credentials.
