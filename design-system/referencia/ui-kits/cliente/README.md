# Cliente — customer dashboard

Shopper-facing. Screens: CustomerHome (in-transit order w/ steps, cashback, recent orders, favorites), CustomerOrders (list → detail dialog w/ steps), CustomerMore.jsx (CustomerFavorites grid, CustomerAccount form/addresses/notifications).

Shell + grid: `../shared/AppShell.jsx`, `../../runtime/estilo-original/kit.css` (o original do export, carregado pelo `styles.css`). Components come from `../../runtime/ds-bundle.js` (window.AVLEDesignSystem_11270f), a frozen copy of the exported code. Theme persists in localStorage `avle-theme`; page in `avle-cliente-page`.

New design in the style of the Finpath reference (no prior AVLE product UI was supplied).
