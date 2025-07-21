module.exports = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  projectId: process.env.GCLOUD_PROJECT,
  // Allowed users - only these users can interact with the bot
  // MUST be set via environment variable ALLOWED_USERS
  allowedUsers: process.env.ALLOWED_USERS ? 
    process.env.ALLOWED_USERS.split(',').map(id => id.trim()) : 
    [], // Empty array if not specified - bot will reject all users
};