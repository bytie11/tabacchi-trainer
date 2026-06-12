import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './AppLayout.css';

/** Maps pathname → page title for mobile header */
const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/quiz': 'Quiz',
  '/learning': 'Apprendimento',
  '/catalogo': 'Catalogo',
  '/statistiche': 'Statistiche',
  '/about': 'Informazioni',
};

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/quiz', icon: '🎯', label: 'Quiz' },
  { to: '/learning', icon: '📚', label: 'Learning' },
  { to: '/catalogo', icon: '📋', label: 'Catalogo' },
  { to: '/statistiche', icon: '📊', label: 'Statistiche' },
  { to: '/about', icon: 'ℹ️', label: 'Info' },
];

/** Bottom nav only shows the 5 main sections (no Info) */
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== '/about');

export const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? '';

  return (
    <div className="app-layout">
      {/* ── Desktop Sidebar ── */}
      <aside className="app-sidebar" aria-label="Menu laterale">
        <NavLink to="/" className="app-sidebar__logo" aria-label="Home">
          <span className="app-sidebar__logo-icon">🎓</span>
          <span className="app-sidebar__logo-text">Tabacchi Trainer</span>
        </NavLink>

        <nav className="app-sidebar__nav" aria-label="Navigazione principale">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? ' active' : ''}`
              }
            >
              <span className="app-sidebar__link-icon">{item.icon}</span>
              <span className="app-sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <p className="app-sidebar__footer-text">
            v1.0 • Formazione interna
          </p>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="app-header">
        <NavLink to="/" className="app-header__brand" aria-label="Home">
          <span className="app-header__brand-icon">🎓</span>
          <span>Tabacchi Trainer</span>
        </NavLink>
        <span className="app-header__page-title">{pageTitle}</span>
      </header>

      {/* ── Main Content ── */}
      <main className="app-main">
        <div className="app-main__content">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="app-bottom-nav" aria-label="Navigazione rapida">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `app-bottom-nav__link${isActive ? ' active' : ''}`
            }
          >
            <span className="app-bottom-nav__icon">{item.icon}</span>
            <span className="app-bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
