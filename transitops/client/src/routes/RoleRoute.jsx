import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../../../transitops/client/src/context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

function RoleLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
        aria-hidden="true"
      />
    </div>
  );
}

function AccessDenied({ role }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-rose-900">Access denied</h2>
      <p className="mt-2 text-sm text-rose-700">
        Your role
        {role ? ` (${ROLE_LABELS[role] ?? role})` : ''}
        {' '}
        does not have permission to view this page.
      </p>
    </div>
  );
}

/**
 * Restricts nested routes to users with one of the allowed roles.
 *
 * @param {object} props
 * @param {string[]} props.allowedRoles
 * @param {'redirect' | 'deny'} [props.unauthorizedMode='redirect']
 * @param {string} [props.redirectTo='/dashboard']
 */
export default function RoleRoute({
  allowedRoles = [],
  unauthorizedMode = 'redirect',
  redirectTo = '/dashboard',
  children,
}) {
  const { profile, loading } = useAuth();
  const userRole = profile?.role;

  if (loading) {
    return <RoleLoadingFallback />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (unauthorizedMode === 'deny') {
      return <AccessDenied role={userRole} />;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return children ?? <Outlet />;
}
