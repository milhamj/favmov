const supabase = require('../config/supabase');
const { errorResponse } = require('../utils/responses');

/**
 * Middleware to authenticate user using Supabase JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
    
    // Add user to request object
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};

module.exports = { authenticate };