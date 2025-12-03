import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import NavbarVisibility from "@/components/layout/navbar-visibility";
import FooterVisibility from "@/components/layout/footer-visibility";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { FOOTER_COLUMNS, FOOTER_POLICIES, FOOTER_COPYRIGHT } from "@/lib/config/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Code Keeper - Organize Your Code Repositories & Snippets",
  description: "A modern platform for managing code repositories, snippets, and development resources. Built for developers who value organization and efficiency.",
  keywords: ["code management", "code repositories", "code snippets", "developer tools", "code organization"],
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col bg-background">
            <NavbarVisibility user={user} />
            <main className="flex-1">{children}</main>
            <FooterVisibility
              name="Code Keeper"
              logo={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                  CK
                </div>
              }
              footerColumns={FOOTER_COLUMNS}
              copyright={FOOTER_COPYRIGHT}
              policies={FOOTER_POLICIES}
              showModeToggle
            />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

