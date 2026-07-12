import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../../transitops/client/src/context/AuthContext';

function AuthLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-600">Loading your session…</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const isAuthenticated = Boolean(user ?? session);

  if (loading) {
    return <AuthLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
