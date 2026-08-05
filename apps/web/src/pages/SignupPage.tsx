import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SignupPage() {
  const handleWhopCheckout = () => {
    // Redirect user to the Whop product checkout page
    window.location.href = 'https://whop.com/clipper-launch-os-53ae/clipper-launch-os-9b/';
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight">Access Clipper Launch OS</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The premium creator workspace. Purchase a license to get instant access.
        </p>
      </div>
      
      <Button onClick={handleWhopCheckout} className="w-full h-12 bg-[#FF6243] hover:bg-[#FF6243]/90 text-white font-medium border-0">
        <img src="https://whop.com/favicon.ico" alt="Whop" className="w-4 h-4 mr-2 filter brightness-0 invert" />
        Purchase on Whop
      </Button>

      <div className="text-center text-sm">
        Already have access?{' '}
        <Link to="/login" className="underline underline-offset-4 font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </div>
    </div>
  );
}
