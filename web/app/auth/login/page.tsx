"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Github from "@/components/logos/github";
import Screenshot from "@/components/ui/screenshot";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
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
      setError(error.message || "Failed to sign in with GitHub");
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
              Keep your code organized and accessible
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Sign in with GitHub to start managing your repositories, snippets, and development resources in one place.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sync with GitHub</h3>
                <p className="text-sm text-muted-foreground">Connect your GitHub account to access all your repositories.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Organize Snippets</h3>
                <p className="text-sm text-muted-foreground">Save and organize your code snippets with tags and categories.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fast & Secure</h3>
                <p className="text-sm text-muted-foreground">Built with modern technologies for speed and security.</p>
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

        {/* Right side - Login Form */}
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
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-muted-foreground">
                Sign in to continue to Code Keeper
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
              onClick={handleGitHubLogin}
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
              By continuing, you agree to our{" "}
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
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
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
