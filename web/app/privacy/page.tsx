import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Code Keeper",
  description: "Code Keeper Privacy Policy - Learn how we handle your data and protect your privacy.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="mb-8">
            <p className="text-muted-foreground">
              At Code Keeper, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              platform for managing code repositories, snippets, and development resources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Account Information</h3>
            <p className="text-muted-foreground mb-4">
              When you create an account or authenticate with Code Keeper, we may collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Name and email address</li>
              <li>Profile picture and username</li>
              <li>Authentication tokens (stored securely and encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.2 GitHub API Data</h3>
            <p className="text-muted-foreground mb-4">
              When you connect your GitHub account to Code Keeper, we access the following information through the GitHub API:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li><strong>Repository Information:</strong> Repository names, descriptions, visibility settings, and metadata</li>
              <li><strong>Code Content:</strong> Files, code snippets, and repository contents that you choose to sync</li>
              <li><strong>Commit History:</strong> Commit messages, authors, timestamps, and file changes</li>
              <li><strong>User Profile Data:</strong> GitHub username, avatar, and public profile information</li>
              <li><strong>Organization Data:</strong> Organization memberships and repository access permissions</li>
              <li><strong>Webhook Data:</strong> Repository events and notifications (if webhooks are enabled)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              We only access data that you explicitly authorize through GitHub&apos;s OAuth consent screen. You can revoke 
              access at any time through your GitHub account settings.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Usage Data</h3>
            <p className="text-muted-foreground mb-4">
              We automatically collect certain information when you use Code Keeper:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
              <li>Error logs and performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.4 Cookies and Tracking Technologies</h3>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our services</li>
              <li>Provide personalized content and features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            
            <p className="text-muted-foreground mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve Code Keeper&apos;s functionality</li>
              <li><strong>Repository Management:</strong> To sync, organize, and display your code repositories and snippets</li>
              <li><strong>Authentication:</strong> To verify your identity and manage access to your account</li>
              <li><strong>Communication:</strong> To send you service-related notifications, updates, and support responses</li>
              <li><strong>Analytics:</strong> To understand how users interact with our platform and improve user experience</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. GitHub API Integration</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 OAuth Authentication</h3>
            <p className="text-muted-foreground mb-4">
              Code Keeper uses GitHub OAuth for authentication. When you connect your GitHub account:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>You will be redirected to GitHub to authorize Code Keeper</li>
              <li>GitHub will show you the specific permissions we request</li>
              <li>You can review and modify these permissions at any time in your GitHub account settings</li>
              <li>You can revoke access at any time, which will immediately stop all API access</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 API Rate Limits</h3>
            <p className="text-muted-foreground mb-4">
              Code Keeper respects GitHub&apos;s API rate limits. We implement caching and request optimization to minimize 
              API calls. Your usage may be subject to GitHub&apos;s rate limiting policies, which vary based on your 
              authentication method and GitHub plan.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Data Storage and Caching</h3>
            <p className="text-muted-foreground mb-4">
              To improve performance and reduce API calls, we may cache certain GitHub data:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Repository metadata and file listings are cached temporarily</li>
              <li>Code content is cached only when you explicitly choose to save it</li>
              <li>All cached data is encrypted and stored securely</li>
              <li>You can request deletion of cached data at any time</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Third-Party Services</h3>
            <p className="text-muted-foreground mb-4">
              Code Keeper integrates with GitHub&apos;s API, which is governed by GitHub&apos;s own Privacy Policy and Terms of Service. 
              We encourage you to review GitHub&apos;s privacy practices at{" "}
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-primary hover:underline">
                GitHub Privacy Statement
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing and Disclosure</h2>
            
            <p className="text-muted-foreground mb-4">We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:</p>
            
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (e.g., hosting, analytics, email services)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
            
            <p className="text-muted-foreground mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Encryption of data in transit using TLS/SSL</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure authentication and authorization mechanisms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and employee training on data protection</li>
              <li>Secure storage of authentication tokens and API keys</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive 
              to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
            
            <p className="text-muted-foreground mb-4">You have the following rights regarding your personal information:</p>
            
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li><strong>Access:</strong> Request access to your personal data we hold</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications (service emails may still be sent)</li>
              <li><strong>Revoke Access:</strong> Revoke GitHub API access through your GitHub account settings</li>
              <li><strong>Cookie Preferences:</strong> Manage cookie preferences through your browser settings</li>
            </ul>
            
            <p className="text-muted-foreground mb-4">
              To exercise these rights, please contact us at the email address provided in the Contact section below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
            
            <p className="text-muted-foreground mb-4">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes 
              outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you 
              delete your account, we will delete or anonymize your personal information, except where we are required to 
              retain it for legal, regulatory, or legitimate business purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children&apos;s Privacy</h2>
            
            <p className="text-muted-foreground mb-4">
              Code Keeper is not intended for users under the age of 13. We do not knowingly collect personal information 
              from children under 13. If we become aware that we have collected personal information from a child under 13, 
              we will take steps to delete such information promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. International Data Transfers</h2>
            
            <p className="text-muted-foreground mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These 
              countries may have data protection laws that differ from those in your country. By using Code Keeper, you 
              consent to the transfer of your information to these countries. We ensure appropriate safeguards are in place 
              to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
            
            <p className="text-muted-foreground mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, 
              legal, or regulatory reasons. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Posting the updated Privacy Policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date at the top of this policy</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Your continued use of Code Keeper after such changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
            
            <p className="text-muted-foreground mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none mb-4 text-muted-foreground">
              <li className="mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@codekeeper.com" className="text-primary hover:underline">
                  privacy@codekeeper.com
                </a>
              </li>
              <li className="mb-2">
                <strong>GitHub:</strong>{" "}
                <a href="https://github.com/faizm10/code-keeper" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-primary hover:underline">
                  github.com/faizm10/code-keeper
                </a>
              </li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <Link 
              href="/" 
              className="text-primary hover:underline font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

