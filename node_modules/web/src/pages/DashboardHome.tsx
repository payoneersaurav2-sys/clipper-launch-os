import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lightbulb, PlayCircle, Plus } from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Good Evening, John.</h1>
          <p className="text-muted-foreground">Today's Mission. Here is your prioritized action plan.</p>
        </div>
        <Button className="shrink-0 shadow-sm shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Inbox / Continue Working */}
        <Card className="col-span-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlayCircle className="h-5 w-5 text-primary" /> Continue Workflow
            </CardTitle>
            <CardDescription className="text-foreground/80">
              Your AI has finished generating 12 hook variations for "The End of AI Wrappers".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full sm:w-auto relative z-10" variant="default">
              Review Hooks in Inbox <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weekly Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">4 / 7 Clips</div>
            <p className="text-sm text-muted-foreground mt-1">
              On track to hit publishing quota.
            </p>
            <div className="mt-6 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[57%]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
           <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">Recent Projects</h3>
           <div className="grid gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary group-hover:bg-background transition-colors">
                    <Lightbulb className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Why Stripe Wins</p>
                    <p className="text-xs text-muted-foreground">Updated 2h ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Open</Button>
              </div>
            ))}
           </div>
        </div>
        
        <div className="space-y-4">
           <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">AI Inbox</h3>
           <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 text-center text-muted-foreground bg-card/50">
              <Sparkles className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No pending tasks.</p>
              <p className="text-xs mt-1">Your AI is resting.</p>
           </div>
        </div>
      </div>
      
    </div>
  );
}
