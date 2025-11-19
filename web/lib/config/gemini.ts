/**
 * Gemini AI Configuration Constants
 * 
 * Configuration values for Gemini AI interactions
 */

/**
 * Maximum number of files to include in detailed context
 */
export const DEFAULT_MAX_FILES = 18

/**
 * Maximum characters per file patch to include in context
 */
export const DEFAULT_MAX_PATCH_CHARS = 2000

/**
 * Gemini model configuration
 */
export const GEMINI_MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  temperature: 0.15,
  topK: 32,
  topP: 0.8,
  maxOutputTokens: 1024,
  responseMimeType: 'application/json' as const,
} as const

