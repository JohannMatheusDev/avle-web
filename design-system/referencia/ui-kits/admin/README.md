# Admin — platform back-office

Uses SideShell (SideNav ≥1100px, BottomNav below). Screens: AdminOverview (GMV, KPIs, approvals, categories, health, alerts), AdminStores (approve / refuse / suspend dialogs), AdminMore.jsx (AdminUsers table, AdminDisputes resolution cards).

Shell + grid: `../shared/AppShell.jsx`, `../../runtime/estilo-original/kit.css` (o original do export, carregado pelo `styles.css`). Components come from `../../runtime/ds-bundle.js` (window.AVLEDesignSystem_11270f), a frozen copy of the exported code. Theme persists in localStorage `avle-theme`; page in `avle-admin-page`.

New design in the style of the Finpath reference (no prior AVLE product UI was supplied).
