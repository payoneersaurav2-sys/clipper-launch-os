import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const errorMsg = searchParams.get('error');

  const handleWhopLogin = () => {
    // This will redirect to the Whop OAuth screen
    // The exact CLIENT_ID must be provided in the .env file in production
    const clientId = import.meta.env.VITE_WHOP_CLIENT_ID || 'dummy_client_id';
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://whop.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Authenticate with your Whop account to access the OS.
        </p>
      </div>
      
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleWhopLogin} className="w-full h-12 bg-[#FF6243] hover:bg-[#FF6243]/90 text-white font-medium border-0">
        <img src="https://whop.com/favicon.ico" alt="Whop" className="w-4 h-4 mr-2 filter brightness-0 invert" />
        Continue with Whop
      </Button>

      <div className="text-center text-sm">
        Don't have a membership?{' '}
        <Link to="/signup" className="underline underline-offset-4 font-medium text-primary hover:text-primary/80">
          Purchase access
        </Link>
      </div>
    </div>
  );
}
