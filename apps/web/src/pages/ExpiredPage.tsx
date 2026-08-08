import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExpiredPage() {
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();

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
            <Button onClick={() => navigate('/pricing')} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium border-0">
                View plans on Whop
            </Button>
            
            <Button onClick={() => signOut()} variant="ghost" className="w-full">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
        </div>

      </div>
    </div>
  );
}
