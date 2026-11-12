# Accessibility Statement

**Ola Charge Tracker** aims to provide an accessible experience across desktop browsers, Android devices, and iOS Safari (including Home Screen PWA mode).

## Measures Taken

- **Semantic UI & Keyboard Navigation**: Built on Radix UI / `shadcn/ui` primitives with focus rings, ARIA labels on icon-only controls, and keyboard-accessible dialogs, tabs, menus, and sliders.
- **5 High-Contrast Themes**: Includes *Midnight Cobalt*, *iOS Porcelain* (light mode), *Titanium Amber*, *Alpine Mint*, and *Track Rosso* using theme-aware CSS variables.
- **Touch & Mobile Usability**: `ios-touch` controls, safe-area padding (`viewport-fit=cover`), and responsive table/card views for small screens.

## Known Limitations & Feedback

- Data visualizations rendered via Recharts SVG tooltips may provide limited screen-reader narration compared to tabular summaries in **History**.

If you encounter any accessibility barriers, please open a [Bug Report](https://github.com/codewithyuvraj24/ola-charge-tracker/issues/new/choose) describing the page, browser/assistive technology used, and the barrier encountered.
