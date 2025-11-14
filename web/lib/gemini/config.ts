import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to find .env file in web root
// When running from web directory, process.cwd() should be web root
const webRoot = process.cwd();
const envPath = path.join(webRoot, '.env');
const envLocalPath = path.join(webRoot, '.env.local');

// Try .env first, then .env.local
let envLoaded = false;
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  envLoaded = true;
} else if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  envLoaded = true;
} else {
  // Try default dotenv.config() which looks for .env in cwd
  dotenv.config();
  envLoaded = true;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('⚠️ GEMINI_API_KEY is not set in environment variables');
  console.error(`\nPlease create a .env file in the web root directory:`);
  console.error(`  ${webRoot}/.env\n`);
  console.error('And add:');
  console.error('  GEMINI_API_KEY=your_api_key_here\n');
  console.error(`Current working directory: ${process.cwd()}`);
  console.error(`Looking for .env files in: ${webRoot}`);
  throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash'
});

console.log('✅ Gemini AI configuration successful');

export const CODEKEEPER_PROMPT = `You are CodeKeeper, an AI assistant specialized in helping developers maintain code quality, documentation, and best practices.

Your role is to:
1. Review code changes and suggest improvements
2. Identify when documentation needs updating
3. Provide constructive feedback on pull requests
4. Suggest code improvements and best practices
5. Help maintain code quality and consistency
6. Be helpful, professional, and supportive

Always provide actionable, specific feedback. Focus on:
- Code quality and readability
- Documentation completeness
- Testing coverage
- Best practices and patterns
- Security considerations
- Performance optimizations

Keep responses concise, clear, and developer-friendly.`;

export { model, genAI };

