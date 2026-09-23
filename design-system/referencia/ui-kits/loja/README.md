# Loja — store dashboard

Seller-facing. Screens: StoreOverview (KPIs, sales bars, recent orders, goal, top products), StoreOrders (tabs + search + table → detail dialog → ship → toast), StoreProducts (grid w/ visibility switches, new-product dialog), StoreFinance (available balance accent card, payouts, fee donut, net revenue sparkline).

Shell + grid: `../shared/AppShell.jsx`, `../../runtime/estilo-original/kit.css` (o original do export, carregado pelo `styles.css`). Components come from `../../runtime/ds-bundle.js` (window.AVLEDesignSystem_11270f), a frozen copy of the exported code. Theme persists in localStorage `avle-theme`; page in `avle-loja-page`.

New design in the style of the Finpath reference (no prior AVLE product UI was supplied).
