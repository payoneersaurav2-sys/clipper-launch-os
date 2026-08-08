import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Zap, Type, Rocket,
  BarChart2, ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_KEY = 'cos_tour_complete_v1';

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  highlight: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to Creator OS',
    description: 'Your AI-powered operating system for creating viral content. Let us show you around in 60 seconds.',
    icon: Sparkles,
    href: '/dashboard',
    highlight: 'The dashboard is your command centre — see all your stats, missions, and campaigns at a glance.',
  },
  {
    title: 'Idea Studio',
    description: 'Generate unlimited viral content ideas tailored to your niche, audience, and platform.',
    icon: Lightbulb,
    href: '/dashboard/idea-studio',
    highlight: 'Click "Generate Ideas" and the AI will produce 5 unique, ready-to-use ideas in seconds.',
  },
  {
    title: 'Hook Engine',
    description: 'Write scroll-stopping first lines. The AI scores and rewrites every hook for maximum impact.',
    icon: Zap,
    href: '/dashboard/hook-engine',
    highlight: 'A great hook is the difference between 100 views and 1 million. Let AI write yours.',
  },
  {
    title: 'Caption OS',
    description: 'Generate complete captions with CTAs, hashtags, and platform-specific formatting — instantly.',
    icon: Type,
    href: '/dashboard/caption-os',
    highlight: 'Generate once, get variants for TikTok, Instagram, and YouTube automatically.',
  },
  {
    title: 'Campaign OS',
    description: 'Plan and manage your entire content production pipeline from research to growth.',
    icon: Rocket,
    href: '/dashboard/campaign-os',
    highlight: 'Create campaigns, track clips through the Kanban pipeline, and never lose track of a piece of content.',
  },
  {
    title: 'Analytics',
    description: 'Track your performance, AI usage, and content stats — all in one dashboard.',
    icon: BarChart2,
    href: '/dashboard/analytics',
    highlight: 'See exactly which hooks, captions, and campaigns are performing best over time.',
  },
];

export function ProductTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    onComplete();
  };

  useEffect(() => {
    navigate(current.href);
  }, [current.href, navigate]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Tour card — bottom-left */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto absolute bottom-6 left-6 w-80 bg-[#111111] border border-white/[0.10] rounded-[20px] p-6 shadow-2xl">

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/40 w-3' : 'bg-white/[0.10] w-3'}`} />
            ))}
            <span className="ml-auto text-[11px] text-[#71717A]">{step + 1}/{STEPS.length}</span>
          </div>

          {/* Icon + title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#FAFAFA] tracking-tight">{current.title}</h3>
          </div>

          <p className="text-[13px] text-[#71717A] leading-relaxed mb-3">{current.description}</p>

          <div className="p-3 rounded-[10px] bg-primary/[0.06] border border-primary/20 mb-5">
            <p className="text-[12px] text-primary leading-relaxed">💡 {current.highlight}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={handleComplete} className="text-[12px] text-[#71717A] hover:text-[#FAFAFA] transition-colors">
              Skip tour
            </button>
            <div className="flex gap-2 ml-auto">
              {step > 0 && (
                <Button onClick={() => setStep(s => s - 1)} variant="outline"
                  className="h-9 w-9 p-0 rounded-[10px] border-white/[0.08] bg-transparent text-[#A1A1AA]">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleNext}
                className="h-9 rounded-[10px] bg-primary text-white hover:bg-primary/90 text-[12px] px-4">
                {step === STEPS.length - 1 ? 'Finish' : (
                  <span className="flex items-center gap-1">Next <ChevronRight className="h-3.5 w-3.5" /></span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useTour() {
  const [showTour, setShowTour] = useState(() => !localStorage.getItem(TOUR_KEY));

  return {
    showTour,
    startTour: () => setShowTour(true),
    completeTour: () => setShowTour(false),
    resetTour: () => { localStorage.removeItem(TOUR_KEY); setShowTour(true); },
  };
}
