import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


export default function AcceptableUsePage() {
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Acceptable Use Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <p>This Acceptable Use Policy outlines the prohibited uses of Creator OS. By using our service, you agree to comply with this policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Prohibited Activities</h2>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Illegal Activity:</strong> You may not use Creator OS for any unlawful purposes or in furtherance of illegal activities.</li>
            <li><strong>Abuse of Service:</strong> You may not attempt to bypass usage limits, rate limits, or access restricted areas of the service.</li>
            <li><strong>Security Attacks:</strong> You may not attempt to disrupt or compromise the security, integrity, or performance of Creator OS, including distributing malware or engaging in credential theft.</li>
            <li><strong>Infringement:</strong> You may not generate or distribute content that infringes upon the intellectual property or privacy rights of third parties.</li>
            <li><strong>Spam and Fraud:</strong> You may not use the service for impersonation, fraud, or generating automated spam.</li>
            <li><strong>Excessive Resource Consumption:</strong> You may not use automated scripts or bots to extract data or consume excessive AI generation credits beyond normal human use.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Enforcement</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate this policy, with or without notice.
          </p>
        </section>
      </div>
    </div>
  );
}
