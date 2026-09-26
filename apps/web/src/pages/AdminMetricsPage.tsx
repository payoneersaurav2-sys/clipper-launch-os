import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { Shield, Loader2, Users, Activity, FileText, Target, BookOpen, Briefcase, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminMetricsPage() {
  const { isAdmin } = useAuthStore();
  const { data: metrics, isLoading } = useAdminMetrics();

  // Verify admin authorization strictly (frontend guard — RLS enforces server-side)
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: metrics?.totalUsers ?? 0, icon: Users, color: 'text-blue-400 bg-blue-400/10' },
    { label: 'Total Signups', value: metrics?.totalSignups ?? 0, icon: Users, color: 'text-emerald-400 bg-emerald-400/10' },
    { label: 'Total AI Requests', value: metrics?.totalAIRequests ?? 0, icon: Activity, color: 'text-primary bg-primary/10' },
    { label: 'Content Created', value: metrics?.totalContent ?? 0, icon: FileText, color: 'text-purple-400 bg-purple-400/10' },
    { label: 'Campaigns Created', value: metrics?.totalCampaigns ?? 0, icon: Target, color: 'text-pink-400 bg-pink-400/10' },
    { label: 'Knowledge Items', value: metrics?.totalKnowledge ?? 0, icon: BookOpen, color: 'text-amber-400 bg-amber-400/10' },
    { label: 'Agency Clients', value: metrics?.totalAgencyClients ?? 0, icon: Briefcase, color: 'text-indigo-400 bg-indigo-400/10' },
    { label: 'Checkout Starts', value: metrics?.totalCheckoutStarts ?? 0, icon: ShoppingCart, color: 'text-green-400 bg-green-400/10' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Metrics</h1>
        <p className="text-sm text-muted-foreground mt-1">Aggregate analytics and growth metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 rounded-[16px] border border-white/[0.06] bg-[#111111] p-5 shadow-sm"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#A1A1AA]">{stat.label}</p>
              <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-[16px] border border-white/[0.06] bg-[#111111] p-6 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-lg">
            <span className="text-sm text-[#A1A1AA]">Signups</span>
            <span className="font-medium text-white">{metrics?.totalSignups ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-lg">
            <span className="text-sm text-[#A1A1AA]">Activation (First AI Generation)</span>
            <span className="font-medium text-white">{metrics?.totalActivated ?? 0}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-lg">
            <span className="text-sm text-[#A1A1AA]">Checkout Starts</span>
            <span className="font-medium text-white">{metrics?.totalCheckoutStarts ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
