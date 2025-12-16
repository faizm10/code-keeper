// Test setup file
import { beforeAll, afterAll } from 'vitest'

// Mock environment variables if needed
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'

beforeAll(() => {
  // Setup before all tests
})

afterAll(() => {
  // Cleanup after all tests
})

