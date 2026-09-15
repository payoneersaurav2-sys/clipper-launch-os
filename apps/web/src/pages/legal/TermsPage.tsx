import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TermsPage() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data } = await supabase.rpc('check_legal_status');
        if (data?.terms_version) {
          setVersion(data.terms_version);
        } else {
          setVersion('1.0.0');
        }
      } catch {
        setVersion('1.0.0');
      }
    };
    fetchVersion();
  }, []);

  if (!version) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-6 font-sans text-[#FAFAFA] animate-in fade-in duration-500">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Terms of Service</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>
      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Definitions & Scope</h2>
          <p>
            Welcome to Creator OS ("we", "us", "our"). These Terms of Service ("Terms") govern your access to and use of our application, including the Knowledge Vault, Prompt Centre, Campaign OS, Analytics, and all related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Eligibility & Accounts</h2>
          <p>
            You must be at least 18 years of age (or the age of legal majority in your jurisdiction, whichever is higher) to use the Service. You are responsible for maintaining the security of your account and credentials. We are not liable for any loss or damage arising from your failure to protect your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Acceptable Use</h2>
          <p>
            You agree not to use the Service to: (a) violate any laws or regulations; (b) infringe the intellectual property or privacy rights of third parties; (c) distribute malware or conduct security attacks; (d) engage in automated scraping, spam, or abusive resource consumption; or (e) generate illegal or harmful content. We reserve the right to investigate and enforce this policy at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Whop Payment Boundary & Subscriptions</h2>
          <p>
            All checkout, payment processing, subscription management, and billing operations are securely handled by our third-party payment and subscription provider, Whop. By subscribing to a paid plan, you agree to Whop's applicable terms and policies. Creator OS does not collect, process, or store raw payment card data. Your access to Creator OS features is tied directly to the subscription entitlements reported to us by Whop.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Cancellation & Refunds</h2>
          <p>
            You may cancel your subscription at any time through your Whop dashboard. Cancellation will take effect at the end of your current billing cycle. Refunds and cancellation rights are governed by our Refund Policy and any mandatory rights and remedies available to you under applicable law. Nothing in these Terms limits or excludes any consumer right that cannot lawfully be limited or excluded.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Creator OS IP vs. User Content</h2>
          <p>
            <strong>Creator OS IP:</strong> We own the Creator OS software, code, architecture, proprietary UI, documentation, and underlying brand assets. You are granted a limited, non-exclusive, non-transferable license to use the Service.
          </p>
          <p className="mt-2">
            <strong>User Content:</strong> You retain ownership of any original knowledge assets, text, ideas, captions, or files you upload or create within the Service to the extent you have the rights to that content. By uploading User Content, you grant us a limited license solely to host, process, transmit, and display this data to provide the Service, including sending it to our third-party AI providers as context for generation. We do not claim universal ownership over AI-generated outputs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. AI Functionality & Limitations</h2>
          <p>
            Creator OS utilizes third-party artificial intelligence providers (such as OpenRouter) to process your prompts and Knowledge Vault context. AI outputs are probabilistic and may be inaccurate, hallucinated, incomplete, or inappropriate. You are entirely responsible for human review and verification of all AI-generated content before publication. We make no guarantees regarding copyrightability, accuracy, uniqueness, views, follower growth, or business performance resulting from the use of AI outputs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Third-Party Services</h2>
          <p>
            The Service may contain links to or integrate with third-party websites, platforms, or services (e.g., social media APIs). We are not responsible for the content, privacy policies, or practices of any third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Service Availability & Modifications</h2>
          <p>
            We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Suspension & Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these Terms, abuse the Service, or if directed by law enforcement. Upon termination, your right to use the Service immediately ceases.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">11. Disclaimers & Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED. IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">12. Indemnification</h2>
          <p>
            You agree to indemnify and hold Creator OS harmless from any claims, losses, or damages arising out of your User Content, your violation of these Terms, or your infringement of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">13. Copyright & DMCA</h2>
          <p>
            If you believe your copyright-protected work has been infringed on the Service, please submit a written notice to our copyright contact at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">14. General Provisions</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Governing Law:</strong> Creator OS is operated from Nepal. These Terms shall be governed by the laws of Nepal, without regard to conflict of law principles.</li>
            <li><strong>Consumer Rights Savings Clause:</strong> If you are a consumer residing in a jurisdiction with mandatory consumer protection laws (e.g., EU, UK, Australia, US states), nothing in these Terms deprives you of those statutory rights.</li>
            <li><strong>Changes to Terms:</strong> We may update these Terms periodically. We will notify you of material changes by requesting re-acceptance via the Service.</li>
            <li><strong>Severability & Waiver:</strong> If any provision is found unenforceable, the remainder remains in effect. Failure to enforce a right does not constitute a waiver.</li>
            <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and Creator OS regarding the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">15. Contact Information</h2>
          <p>
            For legal inquiries, please contact us at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
