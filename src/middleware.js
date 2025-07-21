// src/middleware.js
const { allowedUsers } = require('./config');

/**
 * Security check to ensure proper configuration
 */
const validateSecurityConfig = () => {
  if (!allowedUsers || allowedUsers.length === 0) {
    console.error('🚨 CRITICAL SECURITY ISSUE: ALLOWED_USERS environment variable is not set!');
    console.error('   The bot will reject ALL users. Set ALLOWED_USERS in your environment variables.');
    console.error('   Example: ALLOWED_USERS=123456789,987654321');
    return false;
  }
  
  console.log(`✅ Security configured: ${allowedUsers.length} authorized user(s)`);
  return true;
};

/**
 * Middleware to check if user is authorized to use the bot
 * @param {Object} ctx - Telegraf context
 * @param {Function} next - Next middleware function
 */
const authorizeUser = (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    console.warn('No user ID found in context');
    return; // Don't respond to messages without user ID
  }
  
  // Check if user is in allowed list
  if (!allowedUsers.includes(userId.toString())) {
    console.warn(`🚨 UNAUTHORIZED ACCESS: User ${userId} (${ctx.from?.username || 'unknown'}) attempted to use the bot`);
    
    // Log unauthorized access attempt
    logUnauthorizedAccess(userId, ctx.from);
    
    // Don't respond to unauthorized users (silent rejection for security)
    return;
  }
  
  console.log(`✅ Authorized access from user ${userId} (${ctx.from?.username || 'unknown'})`);
  return next();
};

/**
 * Log unauthorized access attempts for security monitoring
 * @param {string} userId - The unauthorized user's ID
 * @param {Object} userInfo - User information from Telegram
 */
const logUnauthorizedAccess = (userId, userInfo) => {
  const accessLog = {
    timestamp: new Date().toISOString(),
    userId: userId,
    username: userInfo?.username || 'unknown',
    firstName: userInfo?.first_name || 'unknown',
    lastName: userInfo?.last_name || 'unknown',
    language: userInfo?.language_code || 'unknown',
    action: 'unauthorized_access_attempt'
  };
  
  console.log('🚨 UNAUTHORIZED ACCESS:', accessLog);
  
  // In a production environment, you might want to:
  // - Send this to a security monitoring service
  // - Store in a separate security log database
  // - Send alert to admin
};

/**
 * Get list of authorized users (for admin purposes)
 * @returns {Array} List of authorized user IDs
 */
const getAuthorizedUsers = () => {
  return [...allowedUsers]; // Return copy to prevent modification
};

/**
 * Check if a specific user is authorized
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is authorized
 */
const isUserAuthorized = (userId) => {
  return allowedUsers.includes(userId.toString());
};

module.exports = {
  authorizeUser,
  logUnauthorizedAccess,
  getAuthorizedUsers,
  isUserAuthorized,
  validateSecurityConfig,
}; 