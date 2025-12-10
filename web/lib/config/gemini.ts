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
 * Gemini model generation configuration
 * Note: The model name is specified when creating the model instance, not in generationConfig
 * 
 * maxOutputTokens is set high to ensure complete file summaries are generated without truncation
 */
export const GEMINI_MODEL_CONFIG = {
  temperature: 0.15,
  topK: 32,
  topP: 0.8,
  maxOutputTokens: 8192, // Increased to allow complete, detailed file summaries without truncation
  responseMimeType: 'application/json' as const,
} as const

