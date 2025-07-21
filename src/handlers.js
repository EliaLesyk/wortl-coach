// src/handlers.js
const axios = require('axios');
const { analyzeText, analyzeSpeech, generatePractice, logFeedback, generateReviewExercise } = require('./services');
const { splitMessage, formatToHtml } = require('./utils'); // Import the new utilities

const sendFormattedMessage = async (ctx, text) => {
  try {
    const formattedText = formatToHtml(text);
    const chunks = splitMessage(formattedText);

    for (const chunk of chunks) {
      await ctx.replyWithHTML(chunk);
    }
  } catch (error) {
    console.error('HTML formatting failed, falling back to plain text:', error);
    // Fallback to plain text if HTML formatting fails
    const chunks = splitMessage(text);
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  }
};

const textHandler = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    await ctx.reply('Analysiere deinen Text...');
    
    const rawFeedback = await analyzeText(text);
    await sendFormattedMessage(ctx, rawFeedback);

    await logFeedback(userId, text, rawFeedback); // Log the original raw feedback

  } catch (error) {
    console.error('Error in textHandler:', error);
    await ctx.reply('Sorry, there was an error processing your text message.');
  }
};

const voiceHandler = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const voice = ctx.message.voice;

    console.log(`Voice message received from user ${userId}:`, {
      fileId: voice.file_id,
      duration: voice.duration,
      fileSize: voice.file_size,
      mimeType: voice.mime_type
    });

    if (voice.duration > 300) {
      return ctx.reply('Please send a voice message shorter than 5 minutes.');
    }

    if (voice.duration < 1) {
      return ctx.reply('Please send a voice message longer than 1 second.');
    }
    
    await ctx.reply('Analysiere deine Sprachnachricht...');

    // Get file link with timeout
    console.log('Getting file link...');
    const fileId = voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    console.log('File link obtained:', fileLink.href);

    // Download audio with timeout and better error handling
    console.log('Downloading audio file...');
    const response = await axios({ 
      url: fileLink.href, 
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });
    
    const audioBuffer = Buffer.from(response.data);
    console.log(`Audio downloaded: ${audioBuffer.length} bytes`);

    // Validate audio buffer
    if (audioBuffer.length === 0) {
      throw new Error('Downloaded audio file is empty');
    }

    if (audioBuffer.length > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('Audio file too large');
    }

    console.log('Starting speech analysis...');
    const rawFeedback = await analyzeSpeech(audioBuffer, voice.duration);
    console.log('Speech analysis completed successfully');
    
    await sendFormattedMessage(ctx, rawFeedback);

    await logFeedback(userId, null, rawFeedback, 'voice');
    console.log('Voice message processing completed successfully');

  } catch (error) {
    console.error('Error processing voice message:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Sorry, there was an error processing your voice message.';
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'The voice message took too long to process. Please try a shorter message.';
    } else if (error.message.includes('file too large')) {
      errorMessage = 'The voice message is too large. Please send a shorter message.';
    } else if (error.message.includes('empty')) {
      errorMessage = 'The voice message appears to be empty. Please try recording again.';
    } else if (error.response && error.response.status === 404) {
      errorMessage = 'Could not access the voice message. Please try sending it again.';
    } else if (error.message.includes('Invalid audio data')) {
      errorMessage = 'The voice message format is not supported. Please try recording again.';
    }
    
    await ctx.reply(errorMessage);
  }
};

const practiceHandler = async (ctx) => {
  try {
    const userId = ctx.from.id;
    await ctx.reply('Generiere eine Übung für dich...');
    const practiceExercise = await generatePractice(userId);
    
    await sendFormattedMessage(ctx, practiceExercise);

  } catch (error) {
    console.error('Error in practiceHandler:', error);
    await ctx.reply('Sorry, there was an error generating a practice exercise.');
  }
};

const reviewHandler = async (ctx) => {
  try {
    const userId = ctx.from.id;
    await ctx.reply('Generiere eine Übung basierend auf deinen gespeicherten Phrasen...');
    
    const exercise = await generateReviewExercise(userId);
    
    await sendFormattedMessage(ctx, exercise);

  } catch (error) {
    console.error('Error in reviewHandler:', error);
    await ctx.reply('Sorry, there was an error generating a review exercise.');
  }
};

module.exports = {
  textHandler,
  voiceHandler,
  practiceHandler,
  reviewHandler,
};
