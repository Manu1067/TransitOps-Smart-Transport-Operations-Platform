const supabase = require('../supabaseClient');

/**
 * Extract Bearer token from Authorization header.
 *
 * @param {import('express').Request} req
 * @returns {string | null}
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token || !token.trim()) {
    return null;
  }

  return token.trim();
}

/**
 * Express middleware: verify Supabase JWT and attach req.user.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide a valid Bearer token.',
      });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    const { user } = data;

    req.user = {
      id: user.id,
      email: user.email ?? null,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
}

module.exports = {
  authenticate,
  extractBearerToken,
};