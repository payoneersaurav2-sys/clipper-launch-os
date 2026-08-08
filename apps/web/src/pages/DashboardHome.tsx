import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, Rocket, Lightbulb, CheckCircle2, Circle,
  ArrowRight, Zap, TrendingUp, Clock, Star
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ---- Today's Mission ----------------------------------------
const MISSIONS = [
  { id: 1, title: 'Generate 5 viral ideas',        desc: 'Idea Studio → AI Generate', time: '10 min',  href: '/dashboard/idea-studio',   priority: 'high'   },
  { id: 2, title: 'Score your best hooks',          desc: 'Hook Engine → Score',        time: '5 min',   href: '/dashboard/hook-engine',   priority: 'medium' },
  { id: 3, title: 'Create a 7-day campaign plan',   desc: 'Launch Center → Generate',   time: '15 min',  href: '/dashboard/launch-center', priority: 'high'   },
  { id: 4, title: 'Review AI-generated captions',   desc: 'Caption OS → Generate',      time: '8 min',   href: '/dashboard/caption-os',    priority: 'low'    },
  { id: 5, title: 'Analyse workspace performance',  desc: 'Analytics → Analyse',        time: '3 min',   href: '/dashboard/analytics',     priority: 'medium' },
];

const PRIORITY_COLOR: Record<string, string> = {
  high:   'text-red-400 bg-red-400/10 border-red-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  low:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

// ---- Quick Actions ------------------------------------------
const QUICK_ACTIONS = [
  { label: 'Generate Ideas',     href: '/dashboard/idea-studio',   icon: Lightbulb, color: 'text-yellow-400 bg-yellow-400/10' },
  { label: 'Generate Hooks',     href: '/dashboard/hook-engine',   icon: Zap,       color: 'text-blue-400 bg-blue-400/10'   },
  { label: 'New Campaign',       href: '/dashboard/campaign-os',   icon: Rocket,    color: 'text-primary bg-primary/10'     },
  { label: 'View Analytics',     href: '/dashboard/analytics',     icon: TrendingUp,color: 'text-emerald-400 bg-emerald-400/10' },
];

// ---- Status badge -------------------------------------------
const STATUS_COLORS: Record<string, string> = {
  researching: 'text-blue-400',  planning: 'text-yellow-400',
  recording:   'text-orange-400', editing: 'text-purple-400',
  posting:     'text-primary',    growing: 'text-emerald-400',
  completed:   'text-emerald-400', archived: 'text-[#71717A]',
};

export default function DashboardHome() {
  const { data: campaigns } = useCampaigns();
  const { data: ideas }     = useClipIdeas();
  const recentGens          = useHistoryStore(s => s.getRecent(4));
  const genCount            = useHistoryStore(s => s.records.length);

  const [completed, setCompleted] = useState<number[]>([]);
  const [todayDate] = useState(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

  const activeCampaigns = campaigns?.filter(c => !['completed','archived'].includes(c.status)).slice(0, 3);
  const recentIdeas     = ideas?.slice(0, 4);
  const completedCount  = completed.length;
  const missionPct      = Math.round((completedCount / MISSIONS.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10 pb-16 sm:pb-20 animate-in fade-in slide-in-from-bottom-6 duration-500 font-sans text-[#FAFAFA]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-tight leading-none text-[#FAFAFA]">
            {getGreeting()} 👋
          </h1>
          <p className="text-[#71717A] text-[13px] sm:text-[14px] tracking-tight mt-2">{todayDate}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <div className="text-right">
            <p className="text-[11px] sm:text-[13px] text-[#71717A]">AI Generations</p>
            <p className="text-[18px] sm:text-[20px] font-semibold text-[#FAFAFA] leading-tight">{genCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} to={a.href}>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-[12px] sm:rounded-[14px] bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer group">
              <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] sm:text-[13px] font-medium text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors leading-tight">{a.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#71717A] ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Today's Mission + Recent Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Mission */}
        <div className="md:col-span-2 bg-[#111111] border border-white/[0.06] rounded-[18px] p-4 sm:p-6 lg:p-7 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#FAFAFA] tracking-tight">Today's Mission</h3>
              <p className="text-[12px] text-[#71717A] mt-1">{completedCount} of {MISSIONS.length} complete</p>
            </div>
            {/* Circular progress */}
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="-rotate-90 w-full h-full" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/[0.05]" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray="125.6" strokeDashoffset={125.6 - (missionPct / 100) * 125.6}
                  className="text-primary transition-all duration-700" strokeLinecap="round" />
              </svg>
              <span className="absolute text-[12px] font-bold text-[#FAFAFA]">{missionPct}%</span>
            </div>
          </div>
          <div className="space-y-3">
            {MISSIONS.map(m => {
              const done = completed.includes(m.id);
              return (
                <div key={m.id} className="flex items-center gap-4 group cursor-pointer"
                  onClick={() => setCompleted(p => done ? p.filter(i => i !== m.id) : [...p, m.id])}>
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" strokeWidth={2} />
                    : <Circle className="h-5 w-5 text-[#71717A] group-hover:text-primary transition-colors shrink-0" strokeWidth={1.5} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium tracking-tight transition-colors ${done ? 'text-[#71717A] line-through' : 'text-[#FAFAFA]'}`}>{m.title}</p>
                    <p className="text-[11px] text-[#71717A] mt-0.5">{m.desc}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${PRIORITY_COLOR[m.priority]}`}>{m.priority}</span>
                    <span className="text-[11px] text-[#71717A] hidden sm:flex items-center gap-1">
                      <Clock className="h-3 w-3" />{m.time}
                    </span>
                    <Link to={m.href} onClick={e => e.stopPropagation()}>
                      <ArrowRight className="h-4 w-4 text-[#71717A] hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">Active Campaigns</h3>
            <Link to="/dashboard/campaign-os" className="text-[12px] text-[#71717A] hover:text-primary transition-colors">View all</Link>
          </div>
          {activeCampaigns?.length ? (
            <div className="space-y-3 flex-1">
              {activeCampaigns.map(c => (
                <div key={c.id} className="p-3 rounded-[12px] bg-[#0D0D0D] border border-white/[0.04] hover:border-white/[0.1] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-medium text-[#FAFAFA] truncate pr-2">{c.title}</p>
                    <span className={`text-[10px] capitalize shrink-0 ${STATUS_COLORS[c.status] ?? 'text-[#71717A]'}`}>{c.status}</span>
                  </div>
                  <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${c.completion_pct ?? 20}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Rocket className="h-8 w-8 text-[#71717A] mb-3" />
              <p className="text-[13px] text-[#71717A] mb-3">No active campaigns</p>
              <Link to="/dashboard/campaign-os">
                <Button className="h-8 rounded-[8px] px-4 bg-primary text-white text-[12px]">Create Campaign</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Ideas + AI Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Ideas */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">Recent Ideas</h3>
            <Link to="/dashboard/idea-studio" className="text-[12px] text-[#71717A] hover:text-primary transition-colors">View all</Link>
          </div>
          {recentIdeas?.length ? (
            <div className="space-y-2">
              {recentIdeas.map(idea => (
                <div key={idea.id} className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-white/[0.03] transition-colors">
                  <div className="h-7 w-7 rounded-[8px] bg-yellow-400/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <p className="text-[13px] text-[#A1A1AA] line-clamp-1 flex-1">{idea.title}</p>
                  <span className="text-[11px] text-[#71717A] capitalize">{idea.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lightbulb className="h-8 w-8 text-[#71717A] mb-3" />
              <p className="text-[13px] text-[#71717A] mb-3">No ideas yet</p>
              <Link to="/dashboard/idea-studio">
                <Button variant="outline" className="h-8 rounded-[8px] px-4 border-white/[0.06] bg-transparent text-[#A1A1AA] text-[12px]">
                  Generate Ideas
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent AI Activity */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-[18px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">Recent AI Activity</h3>
            <span className="text-[12px] text-[#71717A]">{genCount} total</span>
          </div>
          {recentGens.length ? (
            <div className="space-y-2">
              {recentGens.map(gen => (
                <div key={gen.id} className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-white/[0.03] transition-colors">
                  <div className="h-7 w-7 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#A1A1AA] line-clamp-1">{gen.promptSummary}</p>
                    <p className="text-[11px] text-[#71717A] capitalize">{gen.category} · {gen.usage.totalTokens} tokens</p>
                  </div>
                  {gen.isFavorite && <Star className="h-3.5 w-3.5 text-primary shrink-0 fill-primary" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-[#71717A] mb-3" />
              <p className="text-[13px] text-[#71717A]">No AI activity yet</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
