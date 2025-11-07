"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Github from "@/components/logos/github";
import Screenshot from "@/components/ui/screenshot";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create client inside the handler to avoid build-time execution
      const supabase = createClient();
      
      // Use NEXT_PUBLIC_SITE_URL from environment if available, otherwise use current origin
      // NEXT_PUBLIC_* variables are available in client components at build time
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          scopes: "repo read:user read:org user:email",
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "Failed to sign up with GitHub");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Visual/Info */}
        <div className="hidden md:block space-y-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                CK
              </div>
              <span className="text-xl font-bold">Code Keeper</span>
            </Link>
            <h1 className="text-4xl font-bold mb-4">
              Start organizing your code today
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join developers who are already using Code Keeper to manage their repositories and code snippets more efficiently.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quick Setup</h3>
                <p className="text-sm text-muted-foreground">Get started in seconds with GitHub OAuth - no passwords to remember.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">All Your Code in One Place</h3>
                <p className="text-sm text-muted-foreground">Access all your GitHub repositories and organize them with custom tags.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Built for speed with modern architecture and optimized performance.</p>
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-8 rounded-lg border border-border overflow-hidden">
            <Screenshot
              srcLight="/dashboard-placeholder.svg"
              srcDark="/dashboard-placeholder-dark.svg"
              alt="Code Keeper Dashboard"
              width={600}
              height={400}
              className="w-full"
            />
          </div>
        </div>

        {/* Right side - Signup Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="md:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                CK
              </div>
              <span className="text-xl font-bold">Code Keeper</span>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Create your account</h2>
              <p className="text-muted-foreground">
                Get started with Code Keeper in seconds
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm mb-6">
                {error}
              </div>
            )}

            <Button
              type="button"
              className="w-full h-12 text-base"
              onClick={handleGitHubSignup}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/" className="text-primary hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
