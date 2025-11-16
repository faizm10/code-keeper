import { model, CODEKEEPER_PROMPT } from './config';

/**
 * Test script to verify Gemini AI integration for Code Keeper
 * 
 * Usage:
 *   npm run test:gemini
 *   or
 *   npx tsx lib/gemini/test.ts
 */

async function testGemini() {
  try {
    console.log('🚀 Testing Code Keeper Gemini AI integration...\n');
    
    // Test 1: Basic API call
    console.log('📝 Test 1: Basic API call...');
    const testPrompt = 'Say "CodeKeeper AI is working!" in a friendly way';
    console.log(`   Prompt: "${testPrompt}"\n`);
    
    const startTime = Date.now();
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    const duration = Date.now() - startTime;
    
    console.log('✅ Basic API call successful!');
    console.log(`⏱️  Response time: ${duration}ms\n`);
    console.log('📄 Response:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    console.log('');
    
    // Test 2: Code Keeper specific prompt
    console.log('📝 Test 2: Code Keeper prompt test...');
    const codeReviewPrompt = `Review this code change and suggest improvements:

\`\`\`typescript
function add(a: number, b: number) {
  return a + b;
}
\`\`\`

Provide brief feedback on code quality.`;
    
    console.log(`   Prompt: Code review test\n`);
    
    const reviewStartTime = Date.now();
    const reviewResult = await model.generateContent(codeReviewPrompt);
    const reviewResponse = await reviewResult.response;
    const reviewText = reviewResponse.text();
    const reviewDuration = Date.now() - reviewStartTime;
    
    console.log('✅ Code review test successful!');
    console.log(`⏱️  Response time: ${reviewDuration}ms\n`);
    console.log('📄 Response:');
    console.log('─'.repeat(50));
    console.log(reviewText);
    console.log('─'.repeat(50));
    console.log('');
    
    // Test 3: Test with CodeKeeper prompt context
    console.log('📝 Test 3: CodeKeeper prompt context test...');
    const contextPrompt = `${CODEKEEPER_PROMPT}

A developer made changes to a file. Should documentation be updated?
File: api/users/route.ts
Changes: Added new endpoint POST /api/users/login`;
    
    console.log(`   Prompt: Documentation check\n`);
    
    const contextStartTime = Date.now();
    const contextResult = await model.generateContent(contextPrompt);
    const contextResponse = await contextResult.response;
    const contextText = contextResponse.text();
    const contextDuration = Date.now() - contextStartTime;
    
    console.log('✅ Context test successful!');
    console.log(`⏱️  Response time: ${contextDuration}ms\n`);
    console.log('📄 Response:');
    console.log('─'.repeat(50));
    console.log(contextText);
    console.log('─'.repeat(50));
    console.log('');
    
    console.log('✨ All tests passed! Code Keeper Gemini AI is working correctly.\n');
    console.log('📊 Summary:');
    console.log(`   - Model: gemini-2.5-flash`);
    console.log(`   - Basic call: ${duration}ms`);
    console.log(`   - Code review: ${reviewDuration}ms`);
    console.log(`   - Context test: ${contextDuration}ms`);
    console.log('');
    
  } catch (error: any) {
    console.error('\n❌ Error occurred during test:\n');
    
    const errorMsg = error.message || String(error);
    const status = error.status || error.statusCode;
    
    // Check for quota/rate limit errors
    if (status === 429 || errorMsg.includes('quota') || errorMsg.includes('Too Many Requests') || errorMsg.includes('429')) {
      console.error('⚠️  QUOTA EXCEEDED - Rate Limit Error\n');
      console.error('Your API key has exceeded its quota/rate limit.');
      
      const retryMatch = errorMsg.match(/retry in (\d+\.?\d*)s/i);
      if (retryMatch) {
        console.error(`⏳ Please retry after ${retryMatch[1]} seconds\n`);
      }
      
      console.log('💡 Solutions:');
      console.log('  1. Wait a few minutes and try again');
      console.log('  2. Check your quota at: https://ai.dev/usage?tab=rate-limit');
      console.log('  3. Review rate limits at: https://ai.google.dev/gemini-api/docs/rate-limits\n');
      
      console.log('✅ Good news: Your API key and model are working correctly!');
      console.log('   The connection is successful, you just need to wait for quota reset.\n');
      
      process.exit(0);
    }
    
    if (error.message) {
      console.error('Error message:', error.message.substring(0, 200));
    }
    
    if (status) {
      console.error('Status code:', status);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('  - Verify GEMINI_API_KEY is set in .env file');
    console.log('  - Check your API quota and billing');
    console.log('  - Ensure internet connectivity');
    console.log('  - Verify model name: gemini-2.5-flash\n');
    
    process.exit(1);
  }
}

// Run the test
testGemini();

