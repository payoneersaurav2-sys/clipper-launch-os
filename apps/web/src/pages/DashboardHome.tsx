import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Good Evening, Creator 👋</h1>
        <p className="text-muted-foreground text-base tracking-wide">Let's build something viral today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: "Ideas Generated", value: "128", trend: "up" },
          { title: "Hooks Created", value: "86", trend: "up" },
          { title: "Clips Produced", value: "42", trend: "up" },
          { title: "Est. Earnings", value: "$1,240", trend: "up" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111111] border-border/40 hover:bg-[#151515] transition-colors rounded-2xl shadow-xl shadow-black/50">
            <CardHeader className="pb-2 pt-6 px-6">
              <CardTitle className="text-[13px] font-medium text-muted-foreground tracking-wide">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-4xl font-bold tracking-tighter text-white mb-6">{stat.value}</div>
              {/* Sparkline Mock */}
              <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,20 Q10,5 20,15 T40,10 T60,18 T80,5 T100,2" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary opacity-80" strokeLinecap="round" />
              </svg>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Mission & Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Today's Mission */}
        <Card className="md:col-span-2 bg-[#111111] border-border/40 rounded-3xl shadow-xl shadow-black/50 overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-medium text-white tracking-wide">Today's Mission</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex flex-col md:flex-row items-center gap-10">
            
            <div className="flex-1 space-y-6 w-full">
              {[
                { title: "Review 8 hook suggestions", desc: "High engagement potential", done: true },
                { title: "Create 5 captions", desc: "For your trending clips", done: false },
                { title: "Launch 1 campaign", desc: "Automate and grow", done: false },
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer">
                  {task.done ? (
                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary/50 transition-colors shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`text-base font-medium tracking-wide ${task.done ? 'text-foreground' : 'text-foreground/80'}`}>{task.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{task.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Circular Progress */}
            <div className="relative h-40 w-40 shrink-0 flex items-center justify-center">
              <svg className="transform -rotate-90 w-full h-full">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="440" strokeDashoffset="110" className="text-primary transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold tracking-tighter text-white">75%</span>
                <span className="text-xs text-muted-foreground font-medium tracking-widest uppercase mt-1">Progress</span>
              </div>
            </div>
            
          </CardContent>
        </Card>

      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Recent Project */}
        <Card className="md:col-span-2 bg-[#111111] border-border/40 rounded-3xl shadow-xl shadow-black/50 overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground tracking-widest uppercase">Recent Project</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 overflow-hidden flex items-center justify-center relative shadow-inner">
                <div className="absolute inset-0 bg-primary/20 opacity-50 mix-blend-overlay" />
                <div className="w-8 h-10 bg-white/10 rounded border border-white/20 shadow-xl" />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-lg font-semibold text-white tracking-wide">Faceless Finance Niche</h4>
                <p className="text-sm text-muted-foreground mt-1">Last edited 2h ago</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-xs flex items-center gap-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[68%]" />
              </div>
              <span className="text-xs font-medium text-muted-foreground tracking-wider">68%</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="bg-[#111111] border-border/40 rounded-3xl shadow-xl shadow-black/50 overflow-hidden flex flex-col justify-between">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-lg font-medium text-white tracking-wide">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex flex-col justify-end h-full">
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-5xl font-bold tracking-tighter text-white">3</span>
              <span className="text-sm font-medium text-emerald-400">+32%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">vs last 7 days</p>
            {/* Sparkline Mock */}
            <svg className="w-full h-12" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,30 Q20,10 40,25 T70,5 T100,10" fill="none" stroke="url(#purple-gradient)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
