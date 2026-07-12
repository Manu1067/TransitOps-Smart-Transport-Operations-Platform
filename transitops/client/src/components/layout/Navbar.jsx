import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';

export default function Navbar({ onMenuToggle }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || profile?.email || 'User';
  const roleLabel = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : null;

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuToggle ? (
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation menu"
              onClick={onMenuToggle}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                ☰
              </span>
            </button>
          ) : null}

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-slate-900 sm:text-lg">TransitOps</p>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Smart Transport Operations
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
            {roleLabel ? <p className="text-xs text-slate-500">{roleLabel}</p> : null}
          </div>

          <div className="flex flex-col text-right sm:hidden">
            <p className="max-w-[8rem] truncate text-xs font-medium text-slate-900">{displayName}</p>
            {roleLabel ? <p className="text-[10px] text-slate-500">{roleLabel}</p> : null}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
