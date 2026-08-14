import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClipIdeas } from '@/hooks/useClipIdeas';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useAnalyticsStats } from '@/hooks/useCampaigns';
import { 
  TrendingUp, Eye, DollarSign, Layers, Zap,
  Star, BarChart2, Activity, Target 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useEntitlements } from '@/hooks/useEntitlements';

// ---- Animated counter ---------------------------------------
function Counter({ value, prefix = '', suffix = '', duration = 1.2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const raf = useRef<number>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      start.current = value;
      setDisplay(value);
      return;
    }
    const begin = start.current;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(begin + (value - begin) * ease));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else start.current = value;
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration, reduceMotion]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ---- Sparkline ----------------------------------------------
function Sparkline({ values, color = '#7C3AED' }: { values: number[]; color?: string }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 100; const h = 32;
  const pts = values.map((v, i) => `${values.length === 1 ? w / 2 : (i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- Stat card ----------------------------------------------
function StatCard({ icon: Icon, label, value, prefix, suffix, trend, sparkValues }:
  { icon: LucideIcon; label: string; value: number; prefix?: string; suffix?: string; trend?: string; sparkValues?: number[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-white/[0.06] rounded-[16px] p-6 hover:border-white/[0.12] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-[10px] bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
        {trend && <span className={`text-[12px] font-medium ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{trend}</span>}
      </div>
      <p className="text-[26px] font-semibold tracking-tight text-[#FAFAFA] leading-none mb-1">
        <Counter value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="text-[12px] text-[#71717A] mb-4">{label}</p>
      {sparkValues && <Sparkline values={sparkValues} />}
    </motion.div>
  );
}

// ---- Bar chart (platform comparison) -----------------------
function PlatformBar({ platform, pct, count }: { platform: string; pct: number; count: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] text-[#A1A1AA] w-20 capitalize">{platform}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary rounded-full"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      <span className="text-[12px] text-[#71717A] w-6 text-right">{count}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { data: entitlements } = useEntitlements();
  const { data: campaigns } = useCampaigns();
  const { data: ideas } = useClipIdeas();
  const { data: stats } = useAnalyticsStats();
  const analyticsEnabled = entitlements?.status === 'active' && ['creator', 'pro', 'agency'].includes(entitlements.tier ?? '');
  const genCount  = useHistoryStore(s => s.records.length);
  const favCount  = useHistoryStore(s => s.getFavorites().length);
  const totalCost = useHistoryStore(s => s.getTotalCost());

  const activeCampaigns   = campaigns?.filter(c => !['completed','archived'].includes(c.status)).length ?? 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length ?? 0;
  const totalIdeas        = ideas?.length ?? 0;

  // AI history is real local workspace history; show a trend only when data exists.
  const usageByDay = useHistoryStore(s => s.getUsageByDay());
  const sparkData  = Object.values(usageByDay).slice(-7).map(v => v / 1000);

  return (
    <div className="os-page max-w-6xl animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Analytics</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Workspace performance at a glance.</p>
      </div>

      {!analyticsEnabled ? (
        <div className="mt-8">
          <UpgradePrompt
            feature="Advanced Analytics"
            requiredPlan="creator"
            description="Analytics unlocks on the Creator plan and includes performance tracking, AI usage, and ROI insights for your workspace."
          />
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        <StatCard icon={Layers}   label="Active Campaigns"  value={activeCampaigns} />
        <StatCard icon={Zap}      label="Ideas Generated"   value={totalIdeas} />
        <StatCard icon={Activity} label="AI Generations"    value={genCount}         sparkValues={sparkData.length > 1 ? sparkData : undefined} />
        <StatCard icon={Star}     label="Favourited"         value={favCount} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Eye}      label="Total Views"       value={stats?.totalViews ?? 0} />
        <StatCard icon={TrendingUp} label="Total Likes"     value={stats?.totalLikes ?? 0} />
        <StatCard icon={DollarSign} label="Total Revenue"   value={parseFloat((stats?.totalRevenue ?? 0).toFixed(2))} prefix="$" />
      </div>

      {/* AI usage section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">AI Usage by Category</h3>
          </div>
          <AICategoryBreakdown />
        </div>

        <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">Campaign Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Active', count: activeCampaigns, total: (campaigns?.length ?? 1) },
              { label: 'Completed', count: completedCampaigns, total: (campaigns?.length ?? 1) },
              { label: 'Planning', count: campaigns?.filter(c=>c.status==='planning').length ?? 0, total: (campaigns?.length ?? 1) },
            ].map(row => (
              <PlatformBar key={row.label} platform={row.label} pct={(row.count / Math.max(row.total, 1)) * 100} count={row.count} />
            ))}
          </div>
        </div>
      </div>

      {/* Token breakdown */}
      <div className="p-6 rounded-[18px] bg-primary/[0.06] border border-primary/20">
        <p className="text-[12px] text-primary uppercase tracking-widest font-medium mb-4">AI Cost Summary</p>
        <div className="flex flex-wrap gap-8">
          <div><p className="text-[22px] font-semibold text-[#FAFAFA]">{genCount}</p><p className="text-[12px] text-[#71717A]">Total Generations</p></div>
          <div><p className="text-[22px] font-semibold text-[#FAFAFA]">${totalCost.toFixed(4)}</p><p className="text-[12px] text-[#71717A]">Estimated Cost</p></div>
          <div><p className="text-[22px] font-semibold text-[#FAFAFA]">{favCount}</p><p className="text-[12px] text-[#71717A]">Saved to Favourites</p></div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function AICategoryBreakdown() {
  const byCategory = useHistoryStore(s => s.getUsageByCategory());
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(byCategory);

  if (!entries.length) return <p className="text-[13px] text-[#71717A]">No generations yet.</p>;

  return (
    <div className="space-y-3">
      {entries.map(([cat, tokens]) => (
        <PlatformBar key={cat} platform={cat} pct={(tokens / total) * 100} count={tokens} />
      ))}
    </div>
  );
}
