import { motion } from 'framer-motion';
import { CheckCircle2, Circle, X, Play, Database, Sparkles, Rocket, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OnboardingChecklistProps {
  hasIdeas: boolean;
  hasKnowledge: boolean;
  hasAI: boolean;
  hasCampaign: boolean;
  onDismiss: () => void;
  isAgency: boolean;
}

interface Step {
  id: string;
  title: string;
  desc: string;
  done: boolean;
  Icon: React.ElementType;
  href: string;
}

export function OnboardingChecklist({
  hasIdeas,
  hasKnowledge,
  hasAI,
  hasCampaign,
  onDismiss,
  isAgency,
}: OnboardingChecklistProps) {
  const steps: Step[] = isAgency
    ? [
        { id: 'client',    title: 'Create your first client workspace', desc: 'Isolate brand contexts per client.', done: true,         Icon: Users,    href: '/agency' },
        { id: 'knowledge', title: 'Add client brand knowledge',          desc: 'Teach Creator OS about the brand.',  done: hasKnowledge, Icon: Database,  href: '/dashboard/knowledge' },
        { id: 'ai',        title: 'Generate client-aware content',       desc: 'Try the AI with client context.',   done: hasAI,        Icon: Sparkles,  href: '/dashboard/idea-studio' },
        { id: 'campaign',  title: 'Build a campaign pipeline',           desc: 'Organise deliverables per client.',  done: hasCampaign,  Icon: Rocket,    href: '/dashboard/campaign-os' },
      ]
    : [
        { id: 'knowledge', title: 'Set up your context',     desc: 'Add brand guidelines to the Vault.',  done: hasKnowledge, Icon: Database, href: '/dashboard/knowledge' },
        { id: 'ideas',     title: 'Generate ideas',           desc: 'Use AI to brainstorm angles.',         done: hasIdeas,     Icon: Sparkles, href: '/dashboard/idea-studio' },
        { id: 'campaign',  title: 'Start your first campaign',desc: 'Plan your content calendar.',          done: hasCampaign,  Icon: Rocket,   href: '/dashboard/campaign-os' },
      ];

  const completedCount = steps.filter((s) => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden rounded-[18px] border border-primary/20 bg-primary/5 p-6"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss onboarding"
        className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-primary">
          <Play className="ml-0.5 h-4 w-4" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-white">
            Let's get Creator OS working for you
          </h2>
          <p className="text-[12px] text-primary/80">
            {completedCount === steps.length
              ? 'All steps complete — you\'re activated!'
              : `Complete these steps to activate your workspace (${progress}% done)`}
          </p>
        </div>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Link key={step.id} to={step.href} className="group block">
            <div
              className={`flex h-full flex-col rounded-xl border p-4 transition-colors ${
                step.done
                  ? 'border-white/10 bg-white/[0.02] opacity-70'
                  : 'border-primary/30 bg-black/40 hover:border-primary/60 hover:bg-black/60'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <step.Icon
                  className={`h-5 w-5 ${step.done ? 'text-zinc-500' : 'text-primary'}`}
                />
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-primary" />
                )}
              </div>
              <h3
                className={`mb-1 flex-1 text-[13px] font-medium ${
                  step.done ? 'text-zinc-400 line-through' : 'text-white'
                }`}
              >
                {step.title}
              </h3>
              <p className="text-[11px] text-zinc-500">{step.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Skip link */}
      <button
        onClick={onDismiss}
        className="mt-4 text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
