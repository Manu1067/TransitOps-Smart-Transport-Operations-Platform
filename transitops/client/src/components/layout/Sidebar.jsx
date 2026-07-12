import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◫' },
  { to: '/vehicles', label: 'Vehicles', icon: '⛟' },
  { to: '/drivers', label: 'Drivers', icon: '👤' },
  { to: '/trips', label: 'Trips', icon: '↔' },
  {
    to: '/maintenance',
    label: 'Maintenance',
    icon: '🔧',
    roles: [ROLES.ADMIN, ROLES.DISPATCHER],
  },
  { to: '/fuel-logs', label: 'Fuel Logs', icon: '⛽' },
  {
    to: '/reports',
    label: 'Reports',
    icon: '📊',
    roles: [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.VIEWER],
  },
];

function SidebarLink({ to, label, icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
        ].join(' ')
      }
    >
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

function isItemVisible(item, role) {
  if (!item.roles) {
    return true;
  }

  return role ? item.roles.includes(role) : false;
}

export default function Sidebar({ open = false, onClose }) {
  const { role } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => isItemVisible(item, role));

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-slate-800 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            TransitOps
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">Fleet Control</h2>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
