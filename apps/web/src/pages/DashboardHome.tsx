import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out pb-20 font-sans text-[#FAFAFA]">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-tight leading-none text-[#FAFAFA]">Good Evening, Creator 👋</h1>
        <p className="text-[#A1A1AA] text-[15px] tracking-tight mt-1">Let's build something viral today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: "Ideas Generated", value: "128", trend: "up" },
          { title: "Hooks Created", value: "86", trend: "up" },
          { title: "Clips Produced", value: "42", trend: "up" },
          { title: "Est. Earnings", value: "$1,240", trend: "up" },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#111111] border border-white/[0.06] hover:bg-[#161616] transition-colors rounded-[16px] shadow-sm">
            <CardHeader className="pb-2 pt-6 px-6">
              <CardTitle className="text-[13px] font-medium text-[#71717A] tracking-tight">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-[32px] font-semibold tracking-tight text-[#FAFAFA] mb-6 leading-none mt-1">{stat.value}</div>
              {/* Sparkline Mock */}
              <svg className="w-full h-6" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,20 Q10,5 20,15 T40,10 T60,18 T80,5 T100,2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" />
              </svg>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Mission & Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Today's Mission */}
        <Card className="md:col-span-2 bg-[#111111] border border-white/[0.06] rounded-[16px] shadow-sm overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-[16px] font-semibold text-[#FAFAFA] tracking-tight">Today's Mission</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex flex-col md:flex-row items-center gap-12">
            
            <div className="flex-1 space-y-5 w-full mt-2">
              {[
                { title: "Review 8 hook suggestions", desc: "High engagement potential", done: true },
                { title: "Create 5 captions", desc: "For your trending clips", done: false },
                { title: "Launch 1 campaign", desc: "Automate and grow", done: false },
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-4 group cursor-pointer">
                  {task.done ? (
                    <CheckCircle2 className="h-[20px] w-[20px] text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-[20px] w-[20px] text-[#71717A] group-hover:text-primary transition-colors shrink-0 mt-0.5" strokeWidth={2} />
                  )}
                  <div>
                    <h4 className={`text-[14px] font-medium tracking-tight ${task.done ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'}`}>{task.title}</h4>
                    <p className="text-[13px] text-[#71717A] mt-0.5">{task.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Circular Progress */}
            <div className="relative h-[140px] w-[140px] shrink-0 flex items-center justify-center">
              <svg className="transform -rotate-90 w-full h-full">
                <circle cx="70" cy="70" r="62" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/[0.04]" />
                <circle cx="70" cy="70" r="62" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="390" strokeDashoffset="97" className="text-primary transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-semibold tracking-tight text-[#FAFAFA] leading-none">75%</span>
                <span className="text-[11px] text-[#71717A] font-medium tracking-wide mt-1">PROGRESS</span>
              </div>
            </div>
            
          </CardContent>
        </Card>

      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Recent Project */}
        <Card className="md:col-span-2 bg-[#111111] border border-white/[0.06] rounded-[16px] shadow-sm overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-[13px] font-medium text-[#71717A] tracking-tight">Recent Project</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 mt-2">
              <div className="h-[72px] w-[72px] rounded-[12px] bg-[#161616] border border-white/[0.06] overflow-hidden flex items-center justify-center relative shadow-inner">
                <div className="w-[30px] h-[40px] bg-white/[0.08] rounded border border-white/[0.1] shadow-sm" />
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-[15px] font-medium text-[#FAFAFA] tracking-tight">Faceless Finance Niche</h4>
                <p className="text-[13px] text-[#71717A] mt-1">Last edited 2h ago</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-[200px] flex items-center gap-4 mt-2">
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[68%]" />
              </div>
              <span className="text-[12px] font-medium text-[#A1A1AA] tracking-tight">68%</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card className="bg-[#111111] border border-white/[0.06] rounded-[16px] shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-[16px] font-semibold text-[#FAFAFA] tracking-tight">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex flex-col justify-end h-full">
            <div className="flex items-baseline gap-3 mb-6 mt-4">
              <span className="text-[40px] font-semibold tracking-tight text-[#FAFAFA] leading-none">3</span>
              <span className="text-[13px] font-medium text-emerald-500">+32%</span>
            </div>
            <p className="text-[12px] text-[#71717A] mb-4">vs last 7 days</p>
            {/* Minimal Sparkline */}
            <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,20 Q20,10 40,15 T70,5 T100,8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" strokeLinecap="round" />
            </svg>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
