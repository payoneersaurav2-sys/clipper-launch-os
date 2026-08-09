import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import Wordmark from '@/components/Wordmark';

const NICHES = ['Finance', 'Fitness', 'Tech', 'Lifestyle', 'Business', 'Education', 'Entertainment', 'Travel', 'Food', 'Gaming', 'Beauty', 'Motivation', 'Other'];
const PLATFORMS = ['TikTok', 'YouTube', 'Instagram', 'Twitter / X', 'LinkedIn', 'Multi-platform'];
const FREQUENCIES = ['1× / day', '2–3× / week', '1× / week', '2–3× / month'];
const EXPERIENCE = ['Just starting out', 'Under 1k followers', '1k–10k followers', '10k–100k followers', '100k+ followers'];
const GOALS = ['Grow my audience', 'Monetise my content', 'Build a personal brand', 'Launch a product', 'Replace my 9-5', 'Have fun creating'];

interface Step { id: number; title: string; subtitle: string; }
const STEPS: Step[] = [
  { id: 1, title: 'Welcome to Creator OS',       subtitle: "Let's personalise your workspace." },
  { id: 2, title: 'What is your niche?',          subtitle: 'We use this to tailor every AI generation.' },
  { id: 3, title: 'Primary platform',             subtitle: 'Where do you create most of your content?' },
  { id: 4, title: 'Posting frequency',            subtitle: 'How often do you publish?' },
  { id: 5, title: 'Your experience level',        subtitle: 'Where are you on your creator journey?' },
  { id: 6, title: 'What are your goals?',         subtitle: 'Select all that apply.' },
  { id: 7, title: 'Name your workspace',          subtitle: 'You can always change this later.' },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i < step ? 'bg-primary flex-1' : i === step ? 'bg-primary/40 flex-1' : 'bg-white/[0.08] flex-1'}`} />
      ))}
    </div>
  );
}

function OptionGrid({ options, value, onChange, multi }: { options: string[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean }) {
  const isSelected = (opt: string) => multi ? (value as string[]).includes(opt) : value === opt;
  const toggle = (opt: string) => {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt]);
    } else {
      onChange(opt);
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => toggle(opt)}
          className={`relative flex items-center gap-3 p-3.5 rounded-[12px] border text-left text-[13px] font-medium transition-all ${isSelected(opt) ? 'border-primary bg-primary/[0.08] text-[#FAFAFA]' : 'border-white/[0.06] bg-[#111111] text-[#A1A1AA] hover:border-white/[0.15] hover:text-[#FAFAFA]'}`}>
          <span className="flex-1">{opt}</span>
          {isSelected(opt) && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createWorkspace } = useWorkspaces();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    niche: '',
    platform: '',
    frequency: '',
    experience: '',
    goals: [] as string[],
    workspaceName: '',
  });

  const currentStep = STEPS[step];
  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return !!form.niche;
    if (step === 2) return !!form.platform;
    if (step === 3) return !!form.frequency;
    if (step === 4) return !!form.experience;
    if (step === 5) return form.goals.length > 0;
    if (step === 6) return form.workspaceName.trim().length >= 2;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Step 1: Guarantee the public.users row exists before anything else.
      // This prevents the FK violation for users who came through Whop OAuth
      // or any path that didn't explicitly insert into public.users.
      const { error: upsertErr } = await supabase.from('users').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
        onboarding_complete: true,
        niche: form.niche,
        platform: form.platform,
        posting_frequency: form.frequency,
        experience_level: form.experience,
        goals: form.goals,
      }, { onConflict: 'id' });

      if (upsertErr) {
        console.error("Failed to upsert user:", upsertErr);
        throw upsertErr;
      }

      // Step 2: Query Supabase directly (bypass TanStack cache) to get the
      // true live workspace count. The useWorkspaces hook auto-creates a
      // workspace in its useEffect, so by the time the user reaches step 7
      // a workspace may already exist. A free account is capped at 1, so we
      // must rename rather than INSERT to avoid PLAN_LIMIT_REACHED.
      const targetName = form.workspaceName.trim() || 'My Workspace';
      const { data: liveWorkspaces, error: wsQueryErr } = await supabase
        .from('workspaces')
        .select('id')
        .is('deleted_at', null)
        .limit(1);

      if (wsQueryErr) {
        console.error("Failed to query workspaces:", wsQueryErr);
        throw wsQueryErr;
      }

      if (liveWorkspaces && liveWorkspaces.length > 0) {
        // Workspace already exists — rename it to the user's chosen name.
        const { error: renameErr } = await supabase
          .from('workspaces')
          .update({ name: targetName })
          .eq('id', liveWorkspaces[0].id);
        if (renameErr) throw renameErr;
      } else {
        // No workspace yet — create one fresh.
        await createWorkspace.mutateAsync(targetName);
      }

      useAuthStore.setState({ onboardingComplete: true });
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error("Failed to finish onboarding:", err);
      setSaveError('We could not finish setting up your workspace. Please retry in a moment.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-start sm:items-center justify-center p-4 sm:p-6 font-sans overflow-y-auto">
      <div className="w-full max-w-lg py-8 sm:py-0">
        {/* Logo */}
        <div className="text-center mb-10">
          <Wordmark size="lg" as="div" className="mx-auto" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
            className="bg-[#111111] border border-white/[0.06] rounded-[20px] sm:rounded-[24px] p-5 sm:p-8 space-y-5 sm:space-y-6">

            {/* Progress */}
            <ProgressBar step={step} total={STEPS.length} />

            {/* Header */}
            <div>
              <p className="text-[11px] text-[#71717A] uppercase tracking-widest mb-2">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-[22px] font-semibold tracking-tight text-[#FAFAFA]">{currentStep.title}</h2>
              <p className="text-[14px] text-[#71717A] mt-1">{currentStep.subtitle}</p>
            </div>

            {/* Step content */}
            {step === 0 && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="h-16 w-16 rounded-[20px] bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-[14px] text-[#A1A1AA] leading-relaxed max-w-sm">
                  We'll ask a few quick questions to personalise your AI, set up your workspace, and calibrate content suggestions just for you.
                </p>
              </div>
            )}
            {step === 1 && <OptionGrid options={NICHES} value={form.niche} onChange={v => setForm(f => ({ ...f, niche: v }))} />}
            {step === 2 && <OptionGrid options={PLATFORMS} value={form.platform} onChange={v => setForm(f => ({ ...f, platform: v }))} />}
            {step === 3 && <OptionGrid options={FREQUENCIES} value={form.frequency} onChange={v => setForm(f => ({ ...f, frequency: v }))} />}
            {step === 4 && <OptionGrid options={EXPERIENCE} value={form.experience} onChange={v => setForm(f => ({ ...f, experience: v }))} />}
            {step === 5 && <OptionGrid options={GOALS} value={form.goals} onChange={v => setForm(f => ({ ...f, goals: v }))} multi />}
            {step === 6 && (
              <div className="space-y-3">
                <Input value={form.workspaceName} onChange={e => setForm(f => ({ ...f, workspaceName: e.target.value }))}
                  placeholder="e.g. My Creator Hub" autoFocus
                  className="h-12 rounded-[12px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50 text-[15px]" />
                <p className="text-[12px] text-[#71717A]">This will be the name of your primary workspace.</p>
              </div>
            )}

            {/* CTA */}
            {saveError && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} role="alert"
                className="rounded-[12px] border border-primary/25 bg-primary/[0.07] px-3.5 py-3 text-[12px] leading-5 text-[#D4D4D8]">
                {saveError}
              </motion.div>
            )}
            <div className="flex items-center gap-3 pt-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}
                  className="h-11 rounded-[12px] border-white/[0.06] bg-transparent text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px]">
                  Back
                </Button>
              )}
              <Button onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleFinish()}
                disabled={!canProceed() || saving}
                className="flex-1 h-11 rounded-[12px] bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] text-[14px] font-medium">
                {saving ? 'Setting up…' : step === STEPS.length - 1 ? 'Launch Creator OS' : (
                  <span className="flex items-center gap-2">Continue <ChevronRight className="h-4 w-4" /></span>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[12px] text-[#71717A] mt-6">
          Complete these quick steps to personalise Creator OS and create your workspace.
        </p>
      </div>
    </div>
  );
}
