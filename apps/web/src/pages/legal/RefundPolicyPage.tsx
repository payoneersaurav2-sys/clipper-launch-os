import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


export default function RefundPolicyPage() {
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Refund Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: October 19, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Scope</h2>
          <p>
            This Refund Policy applies to all paid subscriptions, feature upgrades, and related purchases made for Creator OS ("we", "us", "our"). It outlines how subscription billing, cancellations, and refund reviews are handled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Free Plan</h2>
          <p>
            Creator OS provides a Free plan that allows creators to explore core tools and features without entering payment details. The Free plan is not a trial; it is a permanent tier that does not require subscription fees. Because no charges are incurred on the Free plan, refund terms do not apply to Free accounts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Paid Subscriptions & Trials</h2>
          <p>
            Creator OS offers paid subscription plans (Creator, Pro, and Agency) billed on either a monthly or annual recurring basis.
          </p>
          <p className="mt-2">
            Where a free trial is offered (such as our 3-day free trial on paid plans), the trial duration and subsequent subscription pricing are clearly disclosed prior to checkout. If you do not cancel before the trial period ends, your subscription will automatically convert into a paid recurring subscription billed to your selected payment method. Subscriptions automatically renew at the end of each billing cycle unless cancelled prior to the renewal date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Cancellations</h2>
          <p>
            You may cancel your Creator OS subscription at any time through your account settings or through the billing management portal provided by our payment service provider.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Effect of Cancellation:</strong> Cancelling stops future recurring billing from taking place upon the expiration of your current term.</li>
            <li><strong>Continued Access:</strong> You retain full access to your paid plan features, workspaces, and usage allocations until the conclusion of your current paid billing period.</li>
            <li><strong>Difference from Refunds:</strong> Cancellation stops future renewals; it does not automatically trigger a refund for previously billed subscription periods.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Refund Requests & Review Process</h2>
          <p>
            Because Creator OS provides immediate access to digital workflows, cloud workspace allocations, and AI generation resources upon payment, subscriptions are generally non-refundable once activated, except where provided under this policy or required by applicable law.
          </p>
          <p className="mt-2">
            If you experience an issue or believe you qualify for a refund review, please contact our support team at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a>.
          </p>
          <p className="mt-2">
            To assist us in evaluating your request, please provide:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your account email address.</li>
            <li>Your subscription plan (Creator, Pro, or Agency) and billing frequency (Monthly or Annual).</li>
            <li>Transaction date and payment reference or receipt ID.</li>
            <li>A concise description of the reason for your request.</li>
          </ul>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Each refund request is evaluated individually on a case-by-case basis. Submitting a request does not guarantee that a refund will be issued.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Suspected Duplicate or Erroneous Charges</h2>
          <p>
            If you suspect you have been billed in error or experienced an accidental duplicate charge, please contact us immediately at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a> with your transaction details. If a billing error or duplicate payment is verified, we will issue a prompt correction or refund to your original payment method.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Statutory Consumer Rights</h2>
          <p>
            Nothing in this policy limits, modifies, or excludes any non-waivable legal rights or remedies you may hold under applicable consumer protection legislation in your jurisdiction (such as statutory withdrawal rights in the European Union or United Kingdom, or consumer guarantees under Australian Consumer Law).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
          <p>
            For any inquiries regarding billing, subscription cancellation, or refund reviews, please reach out to our support team at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
