'use client';

import type { ReactNode } from 'react';
import { Avatar } from '../components/core/Avatar';
import { IconButton } from '../components/core/IconButton';
import { BottomNav } from '../components/navigation/BottomNav';
import { SideNav, type SideNavGroup } from '../components/navigation/SideNav';
import { Logo } from '../components/navigation/Logo';
import { TopNav, type NavItem } from '../components/navigation/TopNav';

type BaseDaCasca = {
  page: string;
  setPage: (pagina: string) => void;
  user: string;
  children?: ReactNode;
};

const voltarAoTopo = () => window.scrollTo(0, 0);

/**
 * Casca de tela com barra superior (loja e cliente). No desktop a navegação
 * mora na barra; abaixo de 1100px ela desce para o BottomNav, com no máximo
 * cinco itens.
 */
export function AppShell({ role, nav, page, setPage, user, children, extraEnd }: BaseDaCasca & {
  role: string;
  nav: (NavItem & { icon: string })[];
  /** Controles extras na barra, antes do sino. */
  extraEnd?: ReactNode;
}) {
  return (
    <>
      <TopNav role={role} items={nav} value={page} onChange={setPage} onBrand={() => setPage(nav[0].value)}
        end={<>
          {extraEnd}
          <IconButton icon="bell" dot label="Notificações" />
          <IconButton className="av-topnav__hide-m" icon="settings" label="Configurações" />
          <Avatar name={user} size={40} />
        </>} />
      <main className="kit-main">{children}</main>
      <BottomNav items={nav.slice(0, 5)} value={page} onChange={(v) => { setPage(v); voltarAoTopo(); }} />
    </>
  );
}

/**
 * Casca com navegação lateral (admin). A lateral aparece a partir de 1100px;
 * abaixo disso ela some e a lista `flat` vira o BottomNav.
 */
export function SideShell({ groups, flat, page, setPage, user, children }: BaseDaCasca & {
  groups: SideNavGroup[];
  flat: { value: string; label: string; icon: string; badge?: boolean }[];
}) {
  return (
    <div className="kit-layout">
      <div className="kit-side">
        <SideNav groups={groups} value={page} onChange={setPage}
          header={<div className="kit-side__brand"><Logo height={20} /><span className="av-topnav__role">Admin</span></div>}
          footer={<div className="kit-side__user"><Avatar name={user} size={34} /><div className="kit-side__user-main"><div className="kit-side__user-name">{user}</div><div className="kit-muted">Super admin</div></div></div>} />
      </div>
      <div className="kit-layout__main">
        <TopNav role="Admin" items={[]} value={page}
          end={<><IconButton icon="search" label="Buscar" /><IconButton icon="bell" dot label="Notificações" /><Avatar name={user} size={40} /></>} />
        <main className="kit-main">{children}</main>
        <BottomNav items={flat} value={page} onChange={(v) => { setPage(v); voltarAoTopo(); }} />
      </div>
    </div>
  );
}
