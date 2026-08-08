import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bell, Sparkles, Rocket, CreditCard, Users, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'ai' | 'campaign' | 'billing' | 'team' | 'system';
  title: string;
  message?: string;
  href?: string;
  read: boolean;
  created_at: string;
}

const TYPE_CONFIG = {
  ai:       { icon: Sparkles, color: 'text-primary bg-primary/10' },
  campaign: { icon: Rocket,   color: 'text-yellow-400 bg-yellow-400/10' },
  billing:  { icon: CreditCard, color: 'text-emerald-400 bg-emerald-400/10' },
  team:     { icon: Users,    color: 'text-blue-400 bg-blue-400/10' },
  system:   { icon: Bell,     color: 'text-[#71717A] bg-white/[0.06]' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Seed demo notifications if none exist
const DEMO: Omit<Notification, 'id'>[] = [
  { type: 'ai',       title: 'Idea generation complete', message: '5 viral ideas ready in Idea Studio.',              read: false, created_at: new Date(Date.now() - 300000).toISOString() },
  { type: 'campaign', title: 'Campaign moved to Posting', message: '"Finance Sprint" is now in the Posting stage.',   read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { type: 'system',   title: 'Welcome to Creator OS!',   message: 'Your workspace is ready. Start by generating ideas.', read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export function useNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return DEMO as Notification[];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error || !data?.length) return DEMO as Notification[];
      return data;
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { ...query, markRead, markAllRead };
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: notifications, markRead, markAllRead } = useNotifications();
  const unread = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button onClick={() => setOpen(v => !v)}
        className="relative h-8 w-8 rounded-[8px] flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/[0.05] transition-colors">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_rgba(124,58,237,0.6)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-40 w-80 bg-[#111111] border border-white/[0.08] rounded-[18px] shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-[#FAFAFA]">Notifications</h3>
                  {unread > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{unread} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={() => markAllRead.mutate()}
                      className="text-[11px] text-[#71717A] hover:text-primary transition-colors">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {!notifications?.length ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell className="h-6 w-6 text-[#71717A] mb-2" />
                    <p className="text-[13px] text-[#71717A]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                    const Icon = cfg.icon;
                    return (
                      <div key={n.id} onClick={() => !n.read && markRead.mutate(n.id)}
                        className={`flex gap-3 px-5 py-4 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'hover:bg-white/[0.02]'}`}>
                        <div className={`h-8 w-8 rounded-[8px] flex items-center justify-center shrink-0 ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium text-[#FAFAFA] leading-snug">{n.title}</p>
                            {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                          {n.message && <p className="text-[11px] text-[#71717A] mt-0.5 line-clamp-2">{n.message}</p>}
                          <p className="text-[10px] text-[#71717A] mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.06] text-center">
                <button className="text-[12px] text-[#71717A] hover:text-primary transition-colors">
                  View all notifications
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
