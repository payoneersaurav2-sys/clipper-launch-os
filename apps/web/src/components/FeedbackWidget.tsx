import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2, Bug, Lightbulb, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

type FeedbackType = 'bug' | 'feature' | 'general';

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ElementType; color: string }> = {
  bug:     { label: 'Bug Report',       icon: Bug,         color: 'text-red-400 bg-red-400/10' },
  feature: { label: 'Feature Request',  icon: Lightbulb,   color: 'text-yellow-400 bg-yellow-400/10' },
  general: { label: 'General Feedback', icon: Star,        color: 'text-primary bg-primary/10' },
};

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    // Store in Supabase notifications table as a feedback entry
    const { error } = await supabase.from('notifications').insert({
      user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
      type: 'system',
      title: `[FEEDBACK:${type.toUpperCase()}] ${user?.email ?? 'anonymous'}`,
      message: message.trim(),
    });
    if (error) console.error("Failed to send feedback:", error);

    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setMessage(''); setType('general'); }, 2000);
  };

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center text-white transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
        aria-label="Send feedback">
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><X className="h-5 w-5" /></motion.span>
            : <motion.span key="open"  initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }}><MessageSquarePlus className="h-5 w-5" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-40 w-80 bg-[#111111] border border-white/[0.08] rounded-[20px] p-6 shadow-2xl">

            {sent ? (
              <div className="flex flex-col items-center py-4 text-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <p className="text-[15px] font-semibold text-[#FAFAFA]">Thank you!</p>
                <p className="text-[13px] text-[#71717A]">Your feedback has been received.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#FAFAFA] mb-1">Send Feedback</h3>
                  <p className="text-[12px] text-[#71717A]">Help us make Creator OS better.</p>
                </div>

                {/* Type selector */}
                <div className="flex gap-2">
                  {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map(t => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <button key={t} type="button" onClick={() => setType(t)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-[10px] border text-[10px] font-medium transition-all ${type === t ? `border-primary/50 ${cfg.color}` : 'border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA] bg-[#0D0D0D]'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {t === 'bug' ? 'Bug' : t === 'feature' ? 'Request' : 'General'}
                      </button>
                    );
                  })}
                </div>

                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? 'Describe what happened…' : type === 'feature' ? 'What feature would you love to see?' : 'Share your thoughts…'}
                  rows={4} required
                  className="w-full rounded-[12px] bg-[#0D0D0D] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] p-3 text-[13px] resize-none outline-none focus:border-primary/50 transition-colors" />

                <button type="submit" disabled={sending || !message.trim()}
                  className="w-full h-10 rounded-[12px] bg-primary text-white hover:bg-primary/90 text-[13px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />Send Feedback</>}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
