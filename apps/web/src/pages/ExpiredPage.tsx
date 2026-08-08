import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function ExpiredPage() {
  const signOut = useAuthStore((state) => state.signOut);

  const handleWhopCheckout = () => {
    window.location.href = 'https://whop.com/checkout/plan_xxx'; 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex justify-center">
           <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
           </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">License Inactive</h1>
          <p className="text-muted-foreground text-sm">
            Your Whop membership has expired or was revoked. To restore access to your workspaces, please renew your subscription.
          </p>
        </div>
        
        <div className="pt-4 space-y-3">
            <Button onClick={handleWhopCheckout} className="w-full h-12 bg-[#FF6243] hover:bg-[#FF6243]/90 text-white font-medium border-0">
                <img src="https://whop.com/favicon.ico" alt="Whop" className="w-4 h-4 mr-2 filter brightness-0 invert" />
                Renew on Whop
            </Button>
            
            <Button onClick={() => signOut()} variant="ghost" className="w-full">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
        </div>

      </div>
    </div>
  );
}
