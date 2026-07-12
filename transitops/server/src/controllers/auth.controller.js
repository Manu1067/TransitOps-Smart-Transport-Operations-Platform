const supabase = require('../supabaseClient');

/**
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {unknown} [data=null]
 */
function sendSuccess(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {unknown} [data=null]
 */
function sendError(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getCurrentUser(req, res) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      return sendError(res, 500, error.message || 'Failed to fetch user profile.');
    }

    return sendSuccess(res, 200, 'Current user fetched successfully.', {
      user: req.user,
      profile: profile ?? null,
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to fetch current user.');
  }
}

module.exports = {
  getCurrentUser,
};
