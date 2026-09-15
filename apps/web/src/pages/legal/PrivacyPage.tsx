import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PrivacyPage() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const { data } = await supabase.rpc('check_legal_status');
        if (data?.privacy_version) {
          setVersion(data.privacy_version);
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>
      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <p>
            This Privacy Policy explains how Creator OS ("we", "us", "our"), located at Pokhara, Nepal 33700, collects, uses, and safeguards your personal information when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect (Categories & Sources)</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Account Data:</strong> Email address, name, and profile avatars collected during registration directly or via OAuth.</li>
            <li><strong>Creator & AI Data:</strong> Source materials uploaded to the Knowledge Vault, text prompts, generated campaign ideas, and AI memory context provided by you.</li>
            <li><strong>Technical & Security Data:</strong> IP addresses, browser user-agent data, and security telemetry collected automatically.</li>
            <li><strong>Billing Metadata:</strong> Subscription status and identifiers provided by Whop. We do NOT collect or receive raw payment card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Purposes & Lawful Bases</h2>
          <p>We process your data for the following purposes:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Service Delivery (Contract):</strong> To authenticate you, host your Knowledge Vault, and route prompts to AI models.</li>
            <li><strong>Security (Legitimate Interest):</strong> To prevent fraud, abuse, and enforce our Acceptable Use Policy.</li>
            <li><strong>Billing (Contract):</strong> To synchronize subscription entitlements with Whop.</li>
            <li><strong>Marketing & Analytics (Consent where required):</strong> To track conversions via marketing pixels. (Non-essential pixels load via our application; where required by law, we request consent prior to loading these scripts).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. How We Share Information (Subprocessors)</h2>
          <p>We transmit necessary data to the following subprocessors:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Supabase:</strong> For core database, authentication, and file storage.</li>
            <li><strong>OpenRouter & AI Models:</strong> We route your AI prompts and Knowledge Vault context to third-party models to generate outputs. (We do not control the retention logs or training ingestion mechanisms of third-party underlying model providers).</li>
            <li><strong>Whop:</strong> For subscription billing and analytics.</li>
            <li><strong>Vercel:</strong> For edge function hosting and routing.</li>
            <li><strong>Marketing Pixels:</strong> Meta and X tracking pixels are integrated to measure conversion performance.</li>
          </ul>
          <p className="mt-2 text-sm text-[#A1A1AA]">We utilize third-party subprocessors located in the United States. By using our Service, you acknowledge that your data may be transferred to and processed in the US, subject to applicable law.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Data Retention & Deletion</h2>
          <p>
            Upon an account-deletion request, we delete applicable active account and stored content from our systems. Residual copies may remain temporarily in backups or with third-party providers subject to their retention practices and applicable legal obligations.
            <strong>AI Inputs:</strong> Your prompts are temporarily transmitted to OpenRouter. We do not claim zero-retention or zero-training on behalf of external AI providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. International Privacy Rights</h2>
          <p>Depending on your jurisdiction (such as the EU/EEA (GDPR), UK, Australia, Canada, or California/US states), you may have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate personal data.</li>
            <li>Request deletion of your data.</li>
            <li>Restrict or object to processing (including automated processing/marketing).</li>
            <li>Data portability.</li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          <p className="mt-2">
            <strong>California Residents (Notice at Collection):</strong> We collect identifiers, commercial information, and internet/electronic network activity as described above for service delivery and security. We do not "sell" your data. Since non-essential marketing pixels are currently disabled prior to consent, we do not "share" your personal information for cross-context behavioral advertising.
          </p>
          <p className="mt-2">
            You can manage your data in the Settings panel or contact us to exercise your rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Cookies & Tracking</h2>
          <p>
            We use strictly necessary storage (localStorage, cookies) to maintain your authenticated session and UI state. Non-essential analytics and marketing technologies are not currently active on Creator OS. If such technologies are introduced, we will update our privacy/cookie notices and obtain consent where required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
          <p>
            The Service is not intended for children under 18 years of age (or the age of legal majority in your jurisdiction, whichever is higher). We do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Changes to this Policy</h2>
          <p>
            We may update this policy periodically. We will notify you of material changes by requiring you to accept the updated version within the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
          <p>
            For privacy inquiries, to exercise your rights, or to lodge a complaint, please contact us at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
