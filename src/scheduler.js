// src/scheduler.js
const { sendAutomatedChallenge, shouldSendChallenge, getRandomChallengeTime } = require('./services');

class ChallengeScheduler {
  constructor(bot) {
    this.bot = bot;
    this.activeUsers = new Set();
    this.scheduledChallenges = new Map(); // userId -> timeout
  }

  /**
   * Add a user to the automated challenge system
   */
  addUser(userId) {
    if (!this.activeUsers.has(userId)) {
      this.activeUsers.add(userId);
      console.log(`Added user ${userId} to challenge scheduler`);
      this.scheduleNextChallenge(userId);
    }
  }

  /**
   * Remove a user from the automated challenge system
   */
  removeUser(userId) {
    if (this.activeUsers.has(userId)) {
      this.activeUsers.delete(userId);
      
      // Clear any scheduled challenge for this user
      if (this.scheduledChallenges.has(userId)) {
        clearTimeout(this.scheduledChallenges.get(userId));
        this.scheduledChallenges.delete(userId);
      }
      
      console.log(`Removed user ${userId} from challenge scheduler`);
    }
  }

  /**
   * Schedule the next challenge for a user
   */
  scheduleNextChallenge(userId) {
    // Clear any existing scheduled challenge
    if (this.scheduledChallenges.has(userId)) {
      clearTimeout(this.scheduledChallenges.get(userId));
    }

    // Get random time for next challenge
    const challengeTime = getRandomChallengeTime();
    const now = new Date();
    const delay = challengeTime.getTime() - now.getTime();

    console.log(`Scheduling challenge for user ${userId} at ${challengeTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);

    // Schedule the challenge
    const timeoutId = setTimeout(async () => {
      await this.sendChallenge(userId);
    }, delay);

    this.scheduledChallenges.set(userId, timeoutId);
  }

  /**
   * Send a challenge to a user
   */
  async sendChallenge(userId) {
    try {
      // Check if user should receive a challenge this week
      const shouldSend = await shouldSendChallenge(userId);
      
      if (shouldSend) {
        await sendAutomatedChallenge(userId, this.bot);
        console.log(`Sent automated challenge to user ${userId}`);
      } else {
        console.log(`User ${userId} has already received max challenges this week`);
      }
      
      // Schedule next challenge (2-4 days later)
      const nextChallengeDelay = (2 + Math.random() * 2) * 24 * 60 * 60 * 1000; // 2-4 days
      const nextTimeoutId = setTimeout(async () => {
        await this.sendChallenge(userId);
      }, nextChallengeDelay);
      
      this.scheduledChallenges.set(userId, nextTimeoutId);
      
    } catch (error) {
      console.error(`Error sending challenge to user ${userId}:`, error);
      
      // Retry in 1 hour if there was an error
      const retryTimeoutId = setTimeout(async () => {
        await this.sendChallenge(userId);
      }, 60 * 60 * 1000);
      
      this.scheduledChallenges.set(userId, retryTimeoutId);
    }
  }

  /**
   * Start the scheduler for all active users
   */
  start() {
    console.log('Starting challenge scheduler...');
    
    // Schedule initial challenges for all active users
    this.activeUsers.forEach(userId => {
      this.scheduleNextChallenge(userId);
    });
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('Stopping challenge scheduler...');
    
    // Clear all scheduled timeouts
    this.scheduledChallenges.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    
    this.scheduledChallenges.clear();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      activeUsers: Array.from(this.activeUsers),
      scheduledChallenges: this.scheduledChallenges.size,
      totalUsers: this.activeUsers.size
    };
  }
}

module.exports = ChallengeScheduler; 