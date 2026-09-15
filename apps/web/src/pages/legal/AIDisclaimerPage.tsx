import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


export default function AIDisclaimerPage() {
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
      <h1 className="text-4xl font-bold mb-4 tracking-tight">AI Use & Output Disclaimer</h1>
      <p className="text-[#A1A1AA] mb-2">Effective Date: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-2">Last Updated: September 15, 2026</p>
      <p className="text-[#A1A1AA] mb-8">Version: {version}</p>

      
      <div className="space-y-8 text-[15px] leading-relaxed text-[#D4D4D8]">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Probabilistic Nature of AI</h2>
          <p>
            Creator OS relies on third-party Language Models (via OpenRouter) to generate ideas, hooks, and captions. These AI outputs are probabilistic—they predict text patterns rather than pulling from a factual database. Therefore, outputs may be inaccurate, hallucinated, incomplete, or inappropriate for your audience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. No Guaranteed Business Results</h2>
          <p>
            Creator OS does not guarantee any specific view counts, follower growth, revenue generation, or campaign success resulting from the use of its AI tools. 
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Copyright & Third-Party IP</h2>
          <p>
            Because AI models are trained on vast datasets, generated text may occasionally resemble existing copyrighted material. We do not guarantee that AI outputs are entirely unique or eligible for copyright protection. You remain solely responsible for ensuring that the content you publish does not infringe upon third-party rights or violate platform terms of service (e.g., TikTok, Instagram).
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Human Review Required</h2>
          <p>
            You must not use Creator OS outputs for professional legal, financial, or medical advice. All generated content must be reviewed and verified by a human before publication.
          </p>
        </section>
      </div>
    </div>
  );
}
