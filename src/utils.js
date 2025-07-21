// src/utils.js

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

/**
 * Splits a long message into chunks that are safe for Telegram's message length limit.
 * @param {string} message The message to split.
 * @param {number} maxLength The maximum length of each chunk.
 * @returns {string[]} An array of message chunks.
 */
function splitMessage(message, maxLength = TELEGRAM_MAX_MESSAGE_LENGTH) {
  const chunks = [];
  if (!message) return chunks;

  let currentChunk = "";
  const lines = message.split('\n');

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += line + "\n";
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Comprehensive Markdown to HTML converter for Telegram
 * Handles all the formatting elements used in Gemini responses
 */
function formatToHtml(text) {
  if (!text) return "";

  let formatted = text;
  
  // Escape HTML characters to prevent injection
  formatted = formatted.replace(/&/g, '&amp;');
  formatted = formatted.replace(/</g, '&lt;');
  formatted = formatted.replace(/>/g, '&gt;');
  
  // Convert headers (### Header) to bold text with spacing
  formatted = formatted.replace(/^###\s+(.+)$/gm, '\n<b>$1</b>\n');
  
  // Convert Markdown **bold** to <b>bold</b>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  
  // Convert Markdown * list items to • bullet points (do this BEFORE italic conversion)
  // The 'm' flag is important for multi-line matching
  formatted = formatted.replace(/^\s*\*\s/gm, '• ');
  
  // Convert Markdown - list items to • bullet points (alternative format)
  formatted = formatted.replace(/^\s*-\s/gm, '• ');
  
  // Convert Markdown *italic* to <i>italic</i> (only if not part of a list item)
  // This regex is more careful to avoid converting list markers
  formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<i>$1</i>');
  
  // Convert code blocks (```code```) to <code>code</code>
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<code>$1</code>');
  
  // Convert inline code (`code`) to <code>code</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert horizontal rules (---) to a line separator
  formatted = formatted.replace(/^---$/gm, '───────────────');
  
  // Clean up extra newlines around headers
  formatted = formatted.replace(/\n\n<b>/g, '\n<b>');
  formatted = formatted.replace(/<\/b>\n\n/g, '</b>\n');
  
  // Ensure proper spacing around bullet points
  formatted = formatted.replace(/\n• /g, '\n\n• ');
  
  // Clean up excessive newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Ensure the text doesn't start with newlines
  formatted = formatted.replace(/^\n+/, '');
  
  // Ensure the text doesn't end with newlines
  formatted = formatted.replace(/\n+$/, '');
  
  return formatted;
}

/**
 * Alternative function to format Markdown for Telegram's MarkdownV2 format
 * This is more limited but can be used as a fallback
 */
function formatToMarkdownV2(text) {
  if (!text) return "";
  
  let formatted = text;
  
  // Escape special characters for MarkdownV2
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  specialChars.forEach(char => {
    const regex = new RegExp(`\\${char}`, 'g');
    formatted = formatted.replace(regex, `\\${char}`);
  });
  
  // Convert headers to bold
  formatted = formatted.replace(/^###\s+(.+)$/gm, '*$1*');
  
  // Convert bullet points
  formatted = formatted.replace(/^\s*[\*\-]\s/gm, '• ');
  
  return formatted;
}

module.exports = {
  splitMessage,
  formatToHtml,
  formatToMarkdownV2,
};