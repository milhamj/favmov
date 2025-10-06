const createAuthenticatedSupabaseClient = require('../config/supabase');
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

    const supabase = createAuthenticatedSupabaseClient(token);
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
    
    // Add user and client to request object
    req.user = user;
    req.supabase = supabase;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};

module.exports = { authenticate };