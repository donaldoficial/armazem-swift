import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileInput, BarChart3, Store } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pdv', icon: ShoppingCart, label: 'PDV' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/entrada', icon: FileInput, label: 'Entrada' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Store className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-base font-bold text-foreground">PDV Armazém</h1>
              <p className="text-[10px] text-muted-foreground">Sistema de Vendas</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground text-center">PDV Armazém v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
