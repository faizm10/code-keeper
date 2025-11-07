import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Code Keeper",
  description: "Code Keeper Terms of Service - Read our terms and conditions for using the platform.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="mb-8">
            <p className="text-muted-foreground">
              Welcome to Code Keeper. By accessing or using our platform, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By creating an account, accessing, or using Code Keeper, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service and our Privacy Policy. If you are using Code Keeper on 
              behalf of an organization, you represent that you have the authority to bind that organization to these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              Code Keeper is a platform that helps you manage, organize, and access your code repositories, snippets, 
              and development resources. Our service integrates with GitHub and other third-party services to provide 
              you with a centralized code management solution.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
            <p className="text-muted-foreground mb-4">
              To use Code Keeper, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your account information as needed</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Security</h3>
            <p className="text-muted-foreground mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
            
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground">
              <li>Use Code Keeper for any illegal or unauthorized purpose</li>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Reproduce, duplicate, or copy any part of the service without authorization</li>
              <li>Resell or redistribute the service or any part of it</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. GitHub Integration</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Authorization</h3>
            <p className="text-muted-foreground mb-4">
              When you connect your GitHub account to Code Keeper, you grant us permission to access your GitHub data 
              according to the permissions you authorize. You can revoke this access at any time through your GitHub 
              account settings.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 GitHub Terms</h3>
            <p className="text-muted-foreground mb-4">
              Your use of GitHub is subject to GitHub&apos;s Terms of Service. Code Keeper is not responsible for GitHub&apos;s 
              services or any issues arising from your use of GitHub. We encourage you to review GitHub&apos;s terms at{" "}
              <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-primary hover:underline">
                GitHub Terms of Service
              </a>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 API Usage</h3>
            <p className="text-muted-foreground mb-4">
              Code Keeper uses GitHub&apos;s API in accordance with GitHub&apos;s API Terms of Service. We respect rate limits 
              and implement best practices to minimize API usage. You are responsible for ensuring your GitHub account 
              complies with GitHub&apos;s terms and policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Your Content</h3>
            <p className="text-muted-foreground mb-4">
              You retain all ownership rights to your code, repositories, and other content. By using Code Keeper, you 
              grant us a limited license to access, store, and display your content solely for the purpose of providing 
              the service to you.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Our Service</h3>
            <p className="text-muted-foreground mb-4">
              Code Keeper and its original content, features, and functionality are owned by Code Keeper and are protected 
              by international copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              distribute, or create derivative works of our service without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Service Availability</h2>
            <p className="text-muted-foreground mb-4">
              We strive to provide reliable service, but we do not guarantee that Code Keeper will be available at all 
              times. The service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. 
              We are not liable for any loss or damage resulting from service unavailability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, Code Keeper shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
              or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Indemnification</h2>
            <p className="text-muted-foreground mb-4">
              You agree to indemnify and hold Code Keeper harmless from any claims, damages, losses, liabilities, and expenses 
              (including legal fees) arising from your use of the service, violation of these terms, or infringement of any 
              rights of another party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 By You</h3>
            <p className="text-muted-foreground mb-4">
              You may terminate your account at any time by deleting your account through the account settings or by 
              contacting us. Upon termination, your access to the service will be immediately revoked.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 By Us</h3>
            <p className="text-muted-foreground mb-4">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, 
              including but not limited to violation of these terms, fraudulent activity, or extended periods of inactivity.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Effect of Termination</h3>
            <p className="text-muted-foreground mb-4">
              Upon termination, your right to use the service will cease immediately. We may delete your account data, 
              subject to our data retention policies and legal obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify you of any material changes 
              by posting the updated terms on this page and updating the &quot;Last updated&quot; date. Your continued use of Code Keeper 
              after such changes constitutes your acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard 
              to conflict of law provisions. Any disputes arising from these terms or your use of the service shall be resolved 
              through appropriate legal channels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Severability</h2>
            <p className="text-muted-foreground mb-4">
              If any provision of these Terms of Service is found to be unenforceable or invalid, that provision shall be 
              limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force 
              and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none mb-4 text-muted-foreground">
              <li className="mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:legal@codekeeper.com" className="text-primary hover:underline">
                  legal@codekeeper.com
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

