// src/services.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Firestore, FieldValue } = require('@google-cloud/firestore');
const { SpeechClient } = require('@google-cloud/speech');
const { geminiApiKey, projectId } = require('./config');

const genAI = new GoogleGenerativeAI(geminiApiKey);
const firestore = new Firestore({ projectId });
const speechClient = new SpeechClient({ projectId });

// Using the model you specified
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * NEW, IMPROVED PROMPT for Text Analysis
 * This prompt is more concise and focuses on high-impact feedback.
 */
const analyzeText = async (text) => {
  const prompt = `
    German language coach for C1/C2 speaker. NO introductions or conclusions.
    
    **Task:** Provide 2-3 concrete suggestions for style/word choice improvement.
    
    **Rules:** Ignore typos, capitalization, du/Sie usage.
    
    **Output Format (Markdown):**
    **Vorschlag 1: [Brief Title]**
    * **Statt:** "[original phrase]"
    * **Besser:** "[improved version]"
    * **Warum:** [one-sentence explanation]
    
    **Text:** "${text}"
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * IMPROVED Speech Analysis with Better Error Handling and Configuration
 * This version addresses the encoding and configuration issues that were causing failures.
 */
const analyzeSpeech = async (audioBuffer, durationInSeconds) => {
  try {
    console.log(`Starting speech analysis for ${durationInSeconds}s audio`);
    
    const audio = {
      content: audioBuffer.toString('base64'),
    };

    // Improved configuration for Telegram voice messages
    const config = {
      encoding: 'OGG_OPUS', // Telegram uses OGG with OPUS codec
      sampleRateHertz: 48000, // Telegram's default sample rate
      languageCode: 'de-DE',
      enableAutomaticPunctuation: true,
      enableWordConfidence: true,
      model: durationInSeconds <= 60 ? 'latest_short' : 'latest_long',
      // Add alternative language codes for better recognition
      alternativeLanguageCodes: ['de-AT', 'de-CH'],
      // Enable enhanced models for better accuracy
      useEnhanced: true,
    };

    console.log(`Using config:`, JSON.stringify(config, null, 2));

    let response;
    
    if (durationInSeconds <= 60) {
      // For short audio (< 1 minute)
      console.log(`Using 'recognize' method for short audio (${durationInSeconds}s).`);
      const request = { audio, config };
      
      try {
        [response] = await speechClient.recognize(request);
        console.log('Speech recognition completed successfully');
      } catch (speechError) {
        console.error('Speech recognition failed:', speechError);
        
        // Try with different configuration if first attempt fails
        console.log('Retrying with alternative configuration...');
        const fallbackConfig = {
          ...config,
          encoding: 'WEBM_OPUS', // Try alternative encoding
          sampleRateHertz: 16000, // Try lower sample rate
          useEnhanced: false, // Disable enhanced model
        };
        
        const fallbackRequest = { audio, config: fallbackConfig };
        [response] = await speechClient.recognize(fallbackRequest);
        console.log('Speech recognition completed with fallback config');
      }

    } else {
      // For long audio (> 1 minute)
      console.log(`Using 'longRunningRecognize' method for long audio (${durationInSeconds}s).`);
      const request = { audio, config };
      
      try {
        const [operation] = await speechClient.longRunningRecognize(request);
        console.log('Long-running recognition operation started');
        
        // Wait for the asynchronous operation to complete
        [response] = await operation.promise();
        console.log('Long-running speech recognition completed');
      } catch (speechError) {
        console.error('Long-running speech recognition failed:', speechError);
        throw new Error(`Speech recognition failed: ${speechError.message}`);
      }
    }

    // Process the response
    if (!response || !response.results || response.results.length === 0) {
      console.log('No speech recognition results returned');
      return "Ich konnte leider nichts verstehen. Bitte sprich lauter und deutlicher.";
    }

    let fullTranscript = '';
    const problemWords = [];
    const confidenceThreshold = 0.85; // Slightly lower threshold for better detection

    response.results.forEach((result, index) => {
      console.log(`Processing result ${index + 1}/${response.results.length}`);
      
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        fullTranscript += alternative.transcript + ' ';
        
        console.log(`Transcript part: "${alternative.transcript}"`);
        console.log(`Confidence: ${alternative.confidence}`);
        
        // Word confidence is only available in the 'recognize' response
        if (alternative.words) {
          alternative.words.forEach(wordInfo => {
            if (wordInfo.confidence < confidenceThreshold) {
              problemWords.push(wordInfo.word);
              console.log(`Low confidence word: "${wordInfo.word}" (${wordInfo.confidence})`);
            }
          });
        }
      }
    });

    if (!fullTranscript.trim()) {
      console.log('Empty transcript after processing');
      return "Ich konnte leider nichts verstehen. Bitte sprich lauter und deutlicher.";
    }

    console.log(`Final transcript: "${fullTranscript.trim()}"`);
    console.log(`Problem words: ${problemWords.join(', ')}`);

    // Generate prompt for Gemini
    let prompt;
    if (problemWords.length > 0) {
      const uniqueProblemWords = [...new Set(problemWords)];
      prompt = `
        German language coach for C1/C2 speaker. NO introductions or conclusions.
        
        **Task:** Analyze transcript with pronunciation uncertainties: **${uniqueProblemWords.join(', ')}**
        
        **Output Format (Markdown):**
        ### 1. Gezielte Aussprache-Analyse
        For each uncertain word above:
        * **Wahrscheinlicher Fehler:** [specific pronunciation issue]
        * **Korrekte Aussprache:** [IPA or clear example]
        * **Übungssatz:** [short practice sentence]
        
        ### 2. Stil & Ausdruck
        * **Vorschlag:** [one high-impact improvement for word choice/structure]
        
        **Transcript:** "${fullTranscript.trim()}"
      `;
    } else {
      prompt = `
        German language coach for C1/C2 speaker. NO introductions or conclusions.
        
        **Task:** Provide 2-3 concrete suggestions for style/word choice improvement.
        
        **Output Format (Markdown):**
        **Vorschlag 1: [Brief Title]**
        * **Statt:** "[original phrase]"
        * **Besser:** "[improved version]"
        * **Warum:** [one-sentence explanation]
        
        **Transcript:** "${fullTranscript.trim()}"
      `;
    }

    const result = await model.generateContent(prompt);
    const feedback = await result.response;
    return feedback.text();

  } catch (error) {
    console.error('Error in analyzeSpeech:', error);
    
    // Provide more specific error messages based on the error type
    if (error.message.includes('Invalid audio data')) {
      return "Es gab ein Problem mit dem Audioformat. Bitte versuche es erneut.";
    } else if (error.message.includes('Quota exceeded')) {
      return "Der Sprachdienst ist derzeit überlastet. Bitte versuche es in einigen Minuten erneut.";
    } else if (error.message.includes('Permission denied')) {
      return "Es gab ein Berechtigungsproblem. Bitte kontaktiere den Support.";
    } else {
      return "Es gab ein unerwartetes Problem bei der Sprachverarbeitung. Bitte versuche es erneut.";
    }
  }
};

const generatePractice = async (userId) => {
  const feedbackCollection = firestore.collection('users').doc(String(userId)).collection('feedback_items');
  const snapshot = await feedbackCollection.orderBy('timestamp', 'desc').limit(5).get();

  if (snapshot.empty) {
    return 'No feedback items found to generate practice from.';
  }

  const recentFeedback = snapshot.docs.map(doc => {
    const data = doc.data();
    // Extract the core feedback for better practice generation
    return data.full_feedback.split('Warum:')[0];
  }).join('\n\n');

  const prompt = `
    German language coach for C1/C2 speaker. NO introductions or conclusions.
    
    **Task:** Create one short business practice exercise (2-3 sentences) based on recent feedback.
    
    **Format:**
    Szenario: [brief business context]
    Ihre Aufgabe: [specific task requiring application of feedback]
    
    **Recent Feedback:**
    ${recentFeedback}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

const logFeedback = async (userId, originalText, feedback, type = 'text') => {
  console.log("Attempting to log feedback to Firestore...");
  try {
    const feedbackRef = firestore.collection('users').doc(String(userId)).collection('feedback_items').doc();
    
    // Parse feedback to categorize it better
    const categories = [];
    const phrases = [];
    
    // Extract phrases and categorize based on feedback content
    if (feedback.includes('Statt:') && feedback.includes('Besser:')) {
      // This is a style/improvement suggestion
      categories.push('improvement');
      
      // Extract the original and improved phrases with more flexible regex
      const stattMatches = feedback.match(/\*\*Statt:\*\*\s*["']([^"']+)["']/g);
      const besserMatches = feedback.match(/\*\*Besser:\*\*\s*["']([^"']+)["']/g);
      
      if (stattMatches && besserMatches) {
        stattMatches.forEach((match, index) => {
          const original = match.replace(/\*\*Statt:\*\*\s*["']/, '').replace(/["']$/, '');
          const improved = besserMatches[index] ? besserMatches[index].replace(/\*\*Besser:\*\*\s*["']/, '').replace(/["']$/, '') : '';
          
          if (original && improved && original !== improved) {
            phrases.push({
              original: original,
              improved: improved,
              type: 'improvement',
              importance: 3, // Default importance (1-5 scale)
              repetitions: 0
            });
          }
        });
      }
    }
    
    // Also extract phrases from pronunciation feedback
    if (feedback.includes('Aussprache') || feedback.includes('pronunciation')) {
      categories.push('pronunciation');
      
      // Look for specific words mentioned in pronunciation feedback
      const wordMatches = feedback.match(/["']([^"']+)["']/g);
      if (wordMatches && wordMatches.length > 0) {
        wordMatches.forEach(match => {
          const word = match.replace(/["']/g, '');
          if (word.length > 2) { // Only add meaningful words
            phrases.push({
              original: word,
              improved: word, // Same word, focus on pronunciation
              type: 'pronunciation',
              importance: 3,
              repetitions: 0
            });
          }
        });
      }
    }
    
    // Check for pronunciation feedback
    if (feedback.includes('Aussprache') || feedback.includes('pronunciation')) {
      categories.push('pronunciation');
    }
    
    // Check for grammar feedback
    if (feedback.includes('Grammatik') || feedback.includes('grammar')) {
      categories.push('grammar');
    }
    
    // If no specific categories found, mark as general
    if (categories.length === 0) {
      categories.push('general');
    }
    
    await feedbackRef.set({
      type: type,
      categories: categories,
      original_text: originalText || 'N/A (voice)',
      full_feedback: feedback,
      phrases: phrases,
      timestamp: FieldValue.serverTimestamp(),
      importance: 3, // Default importance (1-5 scale)
      repetitions: 0
    });

    console.log(`Feedback for user ${userId} logged successfully with categories: ${categories.join(', ')}`);
  } catch (error) {
    console.error('CRITICAL: Failed to write feedback to Firestore:', error);
  }
};

/**
 * Get review items for practice
 * Returns phrases that need practice, prioritizing by importance and repetition count
 */
const getReviewItems = async (userId, limit = 3) => {
  try {
    const feedbackCollection = firestore.collection('users').doc(String(userId)).collection('feedback_items');
    
    // Get all feedback items and filter them in memory
    const snapshot = await feedbackCollection
      .orderBy('timestamp', 'desc')
      .limit(50) // Get recent items to filter from
      .get();

    if (snapshot.empty) {
      return [];
    }

    const reviewItems = [];
    const processedPhrases = new Set();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.phrases && Array.isArray(data.phrases)) {
        data.phrases.forEach(phrase => {
          const phraseKey = `${phrase.original}-${phrase.improved}`;
          
          if (!processedPhrases.has(phraseKey)) {
            processedPhrases.add(phraseKey);
            reviewItems.push({
              id: doc.id,
              phraseId: phraseKey,
              original: phrase.original,
              improved: phrase.improved,
              type: phrase.type,
              importance: phrase.importance || data.importance || 3,
              repetitions: phrase.repetitions || 0,
              timestamp: data.timestamp,
              category: data.categories ? data.categories[0] : 'general'
            });
          }
        });
      }
    });

    // Sort by importance (desc) and repetitions (asc)
    reviewItems.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return a.repetitions - b.repetitions;
    });

    // Add randomization while maintaining priority
    // Group items by importance level and add some randomness within each group
    const groupedByImportance = {};
    reviewItems.forEach(item => {
      const importance = item.importance;
      if (!groupedByImportance[importance]) {
        groupedByImportance[importance] = [];
      }
      groupedByImportance[importance].push(item);
    });

    // Shuffle items within each importance group
    Object.keys(groupedByImportance).forEach(importance => {
      groupedByImportance[importance].sort((a, b) => a.repetitions - b.repetitions);
      // Add some randomness: 70% chance to keep order, 30% chance to shuffle
      if (Math.random() < 0.3 && groupedByImportance[importance].length > 1) {
        // Fisher-Yates shuffle for the group
        for (let i = groupedByImportance[importance].length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [groupedByImportance[importance][i], groupedByImportance[importance][j]] = 
          [groupedByImportance[importance][j], groupedByImportance[importance][i]];
        }
      }
    });

    // Reconstruct the list maintaining importance priority but with randomization within groups
    const randomizedItems = [];
    const importanceLevels = Object.keys(groupedByImportance).sort((a, b) => b - a); // Descending importance
    
    importanceLevels.forEach(importance => {
      randomizedItems.push(...groupedByImportance[importance]);
    });

    return randomizedItems.slice(0, limit);
  } catch (error) {
    console.error('Error getting review items:', error);
    return [];
  }
};

/**
 * Generate a review exercise based on phrases from Firestore
 */
const generateReviewExercise = async (userId) => {
  try {
    const reviewItems = await getReviewItems(userId, 3);
    
    if (reviewItems.length === 0) {
      return 'Keine Übungsphrasen gefunden. Sende mir zuerst einige Texte oder Sprachnachrichten für Feedback.';
    }

    // Create a context for the exercise based on the phrases
    const phrasesContext = reviewItems.map(item => 
      `"${item.original}" → "${item.improved}" (${item.category})`
    ).join('\n');

    const prompt = `
      German language coach for C1/C2 speaker. NO introductions or conclusions.
      
      **Task:** Create a short business practice exercise (2-3 sentences) that incorporates these phrases naturally.
      
      **Format:**
      Szenario: [brief business context]
      Ihre Aufgabe: [specific task requiring application of the phrases]
      
      **Phrases to incorporate:**
      ${phrasesContext}
      
      **Rules:**
      - Make the exercise feel natural, not forced
      - Focus on one general business topic (meetings, emails, presentations, etc.)
      - Keep it concise and practical
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const exercise = response.text();

    // Increment practice counters for the phrases used
    await Promise.all(reviewItems.map(async (item) => {
      try {
        const feedbackCollection = firestore.collection('users').doc(String(userId)).collection('feedback_items');
        
        // Find the document containing this phrase
        const snapshot = await feedbackCollection.get();
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.phrases && Array.isArray(data.phrases)) {
            const phraseIndex = data.phrases.findIndex(phrase => 
              `${phrase.original}-${phrase.improved}` === item.phraseId
            );
            
            if (phraseIndex !== -1) {
              // Update the specific phrase's repetition count
              const updatedPhrases = [...data.phrases];
              updatedPhrases[phraseIndex] = {
                ...updatedPhrases[phraseIndex],
                repetitions: (updatedPhrases[phraseIndex].repetitions || 0) + 1
              };
              
              await doc.ref.update({
                phrases: updatedPhrases,
                repetitions: FieldValue.increment(1)
              });
              
              console.log(`Incremented practice counter for phrase: ${item.original}`);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error updating practice counter:', error);
      }
    }));

    return exercise;
  } catch (error) {
    console.error('Error generating review exercise:', error);
    return 'Sorry, there was an error generating a review exercise.';
  }
};

/**
 * Send automated challenge to user
 * This function will be called by the scheduler
 */
const sendAutomatedChallenge = async (userId, bot) => {
  try {
    console.log(`Sending automated challenge to user ${userId}`);
    
    // Randomly choose between review (stored phrases) and practice (general)
    const isReview = Math.random() < 0.5;
    
    if (isReview) {
      // Send review challenge with stored phrases
      const reviewItems = await getReviewItems(userId, 2);
      
      if (reviewItems.length > 0) {
        const challengeMessage = `🎯 **Deine Herausforderung vom Sprachcoach**\n\n` +
          `**Übung mit deinen gespeicherten Phrasen:**\n\n` +
          reviewItems.map((item, index) => 
            `${index + 1}. **${item.original}** → **${item.improved}**\n` +
            `   📂 ${item.category} | ⭐ Wichtigkeit: ${item.importance}/5`
          ).join('\n\n') +
          `\n\n💡 **Deine Aufgabe:** Verwende diese Phrasen in einem kurzen Satz oder einer Antwort.`;
        
        await bot.telegram.sendMessage(userId, challengeMessage, { parse_mode: 'Markdown' });
        console.log(`Sent review challenge to user ${userId}`);
      } else {
        // Fallback to practice if no review items
        await sendPracticeChallenge(userId, bot);
      }
    } else {
      // Send practice challenge
      await sendPracticeChallenge(userId, bot);
    }
    
    // Log that we sent a challenge
    await logChallengeSent(userId, isReview ? 'review' : 'practice');
    
  } catch (error) {
    console.error(`Error sending automated challenge to user ${userId}:`, error);
  }
};

/**
 * Send practice challenge (general scenario)
 */
const sendPracticeChallenge = async (userId, bot) => {
  try {
    const practiceExercise = await generatePractice(userId);
    
    const challengeMessage = `🎯 **Deine Herausforderung vom Sprachcoach**\n\n` +
      `**Allgemeine Übung:**\n\n${practiceExercise}`;
    
    await bot.telegram.sendMessage(userId, challengeMessage, { parse_mode: 'Markdown' });
    console.log(`Sent practice challenge to user ${userId}`);
    
  } catch (error) {
    console.error(`Error sending practice challenge to user ${userId}:`, error);
    // Fallback message if practice generation fails
    const fallbackMessage = `🎯 **Deine Herausforderung vom Sprachcoach**\n\n` +
      `**Übung:** Beschreibe in 2-3 Sätzen, wie du ein neues Projekt in deinem Team vorstellen würdest.`;
    
    await bot.telegram.sendMessage(userId, fallbackMessage, { parse_mode: 'Markdown' });
  }
};

/**
 * Log that a challenge was sent to track frequency
 */
const logChallengeSent = async (userId, challengeType) => {
  try {
    const challengesRef = firestore.collection('users').doc(String(userId)).collection('challenges').doc();
    
    await challengesRef.set({
      type: challengeType,
      timestamp: FieldValue.serverTimestamp(),
      week: getCurrentWeek()
    });
    
    console.log(`Logged ${challengeType} challenge for user ${userId}`);
  } catch (error) {
    console.error('Error logging challenge:', error);
  }
};

/**
 * Get current week number for tracking
 */
const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

/**
 * Check if user should receive a challenge this week
 */
const shouldSendChallenge = async (userId) => {
  try {
    const currentWeek = getCurrentWeek();
    const challengesRef = firestore.collection('users').doc(String(userId)).collection('challenges');
    
    // Count challenges sent this week
    const snapshot = await challengesRef
      .where('week', '==', currentWeek)
      .get();
    
    const challengesThisWeek = snapshot.size;
    console.log(`User ${userId} has received ${challengesThisWeek} challenges this week`);
    
    // Send max 4 challenges per week (2 review + 2 practice)
    return challengesThisWeek < 4;
    
  } catch (error) {
    console.error('Error checking challenge eligibility:', error);
    return true; // Default to allowing challenges if check fails
  }
};

/**
 * Get random time for challenge (between 9 AM and 8 PM)
 */
const getRandomChallengeTime = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Random hour between 9 AM and 8 PM
  const randomHour = Math.floor(Math.random() * 12) + 9; // 9-20
  const randomMinute = Math.floor(Math.random() * 60);
  
  const challengeTime = new Date(today);
  challengeTime.setHours(randomHour, randomMinute, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (challengeTime <= now) {
    challengeTime.setDate(challengeTime.getDate() + 1);
  }
  
  return challengeTime;
};

module.exports = {
  analyzeText,
  analyzeSpeech,
  generatePractice,
  logFeedback,
  getReviewItems,
  generateReviewExercise,
  sendAutomatedChallenge,
  shouldSendChallenge,
  getRandomChallengeTime,
};
