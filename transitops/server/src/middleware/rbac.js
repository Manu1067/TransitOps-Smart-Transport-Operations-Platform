const supabase = require('../supabaseClient');

const VALID_ROLES = Object.freeze(['admin', 'dispatcher', 'driver', 'viewer']);

/**
 * @param {import('express').Request} req
 * @returns {Promise<string | null>}
 */
async function resolveUserRole(req) {
  if (req.user?.role) {
    return req.user.role;
  }

  if (!req.user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  req.user.role = data.role;
  return data.role;
}

/**
 * Express middleware factory for role-based access control.
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function requireRole(...allowedRoles) {
  const roles = allowedRoles.filter(Boolean);

  if (roles.length === 0) {
    throw new Error('requireRole must be called with at least one allowed role.');
  }

  const invalidRoles = roles.filter((role) => !VALID_ROLES.includes(role));
  if (invalidRoles.length > 0) {
    throw new Error(`Invalid role(s): ${invalidRoles.join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const userRole = await resolveUserRole(req);

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'User profile or role not found.',
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.',
        });
      }

      return next();
    } catch {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }
  };
}

module.exports = {
  requireRole,
  resolveUserRole,
  VALID_ROLES,
};