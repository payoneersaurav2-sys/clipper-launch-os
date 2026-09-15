import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


export default function CookiePolicyPage() {
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Cookie Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Strictly Necessary Storage</h2>
          <p>
            Creator OS utilizes local storage and session storage to maintain application functionality. This includes your Supabase authentication session, `creator-os-appearance` (UI theme preference), Zustand application state caches (`creator-os-memory`, `creator-os-history`), and `creator_os_whop_oauth` (secure PKCE validation state for Whop login). These are strictly necessary to provide the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Analytics & Tracking (Non-Essential)</h2>
          <p>
            Non-essential analytics and marketing technologies (such as Meta and X tracking pixels) are not currently active on Creator OS. If such technologies are introduced, we will update our privacy/cookie notices and obtain your consent where required by applicable law.
          </p>
        </section>
      </div>
    </div>
  );
}
