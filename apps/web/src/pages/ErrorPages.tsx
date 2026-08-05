import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Wifi, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  code?: number;
  title: string;
  message: string;
  icon: React.ElementType;
  iconColor: string;
}

function ErrorLayout({ code, title, message, icon: Icon, iconColor }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center max-w-md">
        <div className={`h-16 w-16 rounded-[20px] flex items-center justify-center mb-6 ${iconColor}`}>
          <Icon className="h-7 w-7" />
        </div>
        {code && (
          <p className="text-[12px] text-[#71717A] font-mono uppercase tracking-widest mb-3">{code}</p>
        )}
        <h1 className="text-[28px] font-semibold tracking-tight text-[#FAFAFA] mb-3">{title}</h1>
        <p className="text-[15px] text-[#71717A] leading-relaxed mb-8">{message}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.history.back()} variant="outline"
            className="h-10 rounded-[12px] border-white/[0.08] bg-transparent text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px]">
            <ArrowLeft className="h-4 w-4 mr-1.5" />Go Back
          </Button>
          <Link to="/dashboard">
            <Button className="h-10 rounded-[12px] bg-primary text-white hover:bg-primary/90 text-[13px]">
              <Home className="h-4 w-4 mr-1.5" />Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function NotFoundPage() {
  return <ErrorLayout code={404} title="Page not found" message="This page doesn't exist or has been moved. Check the URL or head back to your dashboard." icon={AlertTriangle} iconColor="bg-yellow-400/10 text-yellow-400" />;
}

export function ForbiddenPage() {
  return <ErrorLayout code={403} title="Access denied" message="You don't have permission to view this page. Contact your workspace owner if you think this is a mistake." icon={Lock} iconColor="bg-red-400/10 text-red-400" />;
}

export function ServerErrorPage() {
  return <ErrorLayout code={500} title="Something went wrong" message="An unexpected error occurred on our end. We're aware and working on a fix. Please try again shortly." icon={AlertTriangle} iconColor="bg-red-400/10 text-red-400" />;
}

export function OfflinePage() {
  return <ErrorLayout title="You're offline" message="No internet connection detected. Check your network and try again." icon={Wifi} iconColor="bg-blue-400/10 text-blue-400" />;
}
