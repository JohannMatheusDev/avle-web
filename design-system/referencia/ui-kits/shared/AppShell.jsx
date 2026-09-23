(() => {
const { TopNav, BottomNav, SideNav, Segmented, IconButton, Avatar, Logo, ToastStack, Toast } = window.AVLEDesignSystem_11270f;

function useTheme() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('avle-theme') || 'dark');
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('avle-theme', theme); }, [theme]);
  return [theme, setTheme];
}

function useToast() {
  const [t, setT] = React.useState(null);
  const show = (msg, tone = 'positive') => { setT({ msg, tone, k: Date.now() }); clearTimeout(window.__avToast); window.__avToast = setTimeout(() => setT(null), 2800); };
  const node = t ? <ToastStack><Toast key={t.k} tone={t.tone}>{t.msg}</Toast></ToastStack> : null;
  return [show, node];
}

function ThemeSwitch({ theme, setTheme }) {
  return <Segmented className="av-topnav__hide-m" options={[{ value: 'light', label: 'Claro', icon: 'sun' }, { value: 'dark', label: 'Escuro', icon: 'moon' }]} value={theme} onChange={setTheme} />;
}

/* Top-nav shell (Loja, Cliente) */
function AppShell({ role, nav, page, setPage, user, theme, setTheme, children, extraEnd }) {
  return <>
    <TopNav base="../../../" role={role} items={nav} value={page} onChange={setPage} onBrand={() => setPage(nav[0].value)}
      end={<>
        <ThemeSwitch theme={theme} setTheme={setTheme} />
        {extraEnd}
        <IconButton icon="bell" dot label="Notificações" />
        <IconButton className="av-topnav__hide-m" icon="settings" label="Configurações" />
        <Avatar name={user} size={40} />
      </>} />
    <main className="kit-main">{children}</main>
    <BottomNav items={nav.slice(0, 5)} value={page} onChange={(v) => { setPage(v); window.scrollTo(0, 0); }} />
  </>;
}

/* Side-nav shell (Admin) */
function SideShell({ groups, flat, page, setPage, user, theme, setTheme, children }) {
  return <div className="kit-layout">
    <div className="kit-side"><SideNav groups={groups} value={page} onChange={setPage}
      header={<div style={{ padding: '6px 12px 12px', display: 'flex', alignItems: 'center', gap: 10 }}><Logo base="../../../" height={20} /><span className="av-topnav__role">Admin</span></div>}
      footer={<div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, background: 'var(--surface-card)' }}><Avatar name={user} size={34} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{user}</div><div className="kit-muted">Super admin</div></div></div>} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <TopNav base="../../../" role="Admin" items={[]} value={page}
        end={<><ThemeSwitch theme={theme} setTheme={setTheme} /><IconButton icon="search" label="Buscar" /><IconButton icon="bell" dot label="Notificações" /><Avatar name={user} size={40} /></>} />
      <main className="kit-main">{children}</main>
      <BottomNav items={flat} value={page} onChange={(v) => { setPage(v); window.scrollTo(0, 0); }} />
    </div>
  </div>;
}

function PageHead({ title, sub, back, onBack, children }) {
  return <div className="kit-head">
    {back && <IconButton icon="arrow-left" label="Voltar" onClick={onBack} />}
    <h1>{title}{sub && <small>{sub}</small>}</h1>
    <div className="kit-tools">{children}</div>
  </div>;
}

const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

Object.assign(window, { AppShell, SideShell, PageHead, useTheme, useToast, brl });
})();
