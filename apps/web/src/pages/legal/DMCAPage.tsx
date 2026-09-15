import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DMCAPage() {
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Copyright Policy</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <p>
            We respect the intellectual property rights of others and expect our users to do the same. If you believe your copyright-protected work was posted on Creator OS without authorization, you may submit a copyright infringement notification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Filing a Notice</h2>
          <p>
            Please provide a written notice to our copyright contact at <a href="mailto:sauravwhop@gmail.com" className="text-primary hover:underline">sauravwhop@gmail.com</a> containing:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>A description of the copyrighted work you claim has been infringed.</li>
            <li>A description of where the allegedly infringing material is located.</li>
            <li>Your contact information (name, address, telephone number, and email).</li>
            <li>A statement that you have a good faith belief that the use is not authorized.</li>
            <li>A physical or electronic signature.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
