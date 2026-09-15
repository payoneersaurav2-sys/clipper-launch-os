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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Refund & Cancellation Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Subscriptions & Billing</h2>
          <p>
            Creator OS partners with Whop to handle all subscription billing, checkout, and entitlements. Your payment relationship is facilitated through the Whop platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Cancellations</h2>
          <p>
            You may cancel your Creator OS subscription at any time by logging into your Whop dashboard. Cancellations will take effect at the end of your current billing cycle, and you will retain access to Creator OS until that cycle concludes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Refund Terms</h2>
          <p>
            Because Creator OS provides immediate access to digital content and AI generations, subscriptions are generally non-refundable unless required by law. If you reside in a jurisdiction where a 14-day cooling-off period applies to digital services (such as the EU or UK), you have the right to cancel and request a refund within 14 days of your initial purchase, provided you have not begun downloading or streaming digital content (including consuming AI generation credits).
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Mandatory Consumer Rights</h2>
          <p>
            Nothing in this policy limits or excludes any mandatory cancellation or refund rights available to you under the consumer protection laws of your jurisdiction (such as the EU Consumer Rights Directive or Australian Consumer Law).
          </p>
        </section>
      </div>
    </div>
  );
}
