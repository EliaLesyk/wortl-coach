// src/bot.js
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { textHandler, voiceHandler, practiceHandler, reviewHandler } = require('./handlers');
const { telegramToken } = require('./config');
const ChallengeScheduler = require('./scheduler');
const { authorizeUser, validateSecurityConfig } = require('./middleware');

const bot = new Telegraf(telegramToken);

// Initialize challenge scheduler
const challengeScheduler = new ChallengeScheduler(bot);

// Validate security configuration before starting
if (!validateSecurityConfig()) {
  console.error('❌ Bot startup aborted due to security configuration issues');
  process.exit(1);
}

// Add authorization middleware to ALL bot interactions
bot.use(authorizeUser);

bot.start((ctx) => {
  const userId = ctx.from.id;
  ctx.reply('Welcome to your AI German Language Coach!');
  
  // Add user to automated challenge system
  challengeScheduler.addUser(userId);
});

bot.help((ctx) => ctx.reply(`🤖 **German Language Coach Commands:**

📝 **Send text or voice messages** for instant feedback

📚 **Commands:**
• /review - Generate exercise using your saved phrases
• /practice - Generate a general practice exercise
• /challenges on - Enable automated challenges (2x/week)
• /challenges off - Disable automated challenges
• /challenges status - Check your challenge status

💡 **Tips:**
• /review creates exercises based on phrases from your feedback history
• /practice generates general exercises for any topic
• Automated challenges appear randomly 2x per week
• Both commands help you practice and improve your German`));

bot.command('practice', practiceHandler);
bot.command('review', reviewHandler);

// Challenge management commands
bot.command('challenges', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const userId = ctx.from.id;
  
  if (args.length < 2) {
    return ctx.reply('Bitte verwende:\n/challenges on - Aktivieren\n/challenges off - Deaktivieren\n/challenges status - Status anzeigen');
  }
  
  const action = args[1].toLowerCase();
  
  switch (action) {
    case 'on':
      challengeScheduler.addUser(userId);
      await ctx.reply('✅ Automatisierte Herausforderungen aktiviert! Du erhältst 2x pro Woche zufällige Übungen.');
      break;
      
    case 'off':
      challengeScheduler.removeUser(userId);
      await ctx.reply('❌ Automatisierte Herausforderungen deaktiviert.');
      break;
      
    case 'status':
      const status = challengeScheduler.getStatus();
      const isActive = status.activeUsers.includes(userId);
      await ctx.reply(`📊 **Challenge Status:**\n\n` +
        `🔄 Automatisierte Herausforderungen: ${isActive ? '✅ Aktiv' : '❌ Inaktiv'}\n` +
        `👥 Aktive Nutzer: ${status.totalUsers}\n` +
        `⏰ Geplante Herausforderungen: ${status.scheduledChallenges}`);
      break;
      
    default:
      await ctx.reply('Ungültige Option. Verwende: on, off, oder status');
  }
});

bot.on(message('text'), textHandler);
bot.on(message('voice'), voiceHandler);

// Start the challenge scheduler when bot launches
bot.launch().then(() => {
  console.log('Bot launched, starting challenge scheduler...');
  challengeScheduler.start();
});

process.once('SIGINT', () => {
  challengeScheduler.stop();
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  challengeScheduler.stop();
  bot.stop('SIGTERM');
});
