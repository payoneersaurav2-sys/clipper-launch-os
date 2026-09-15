import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function assertCurrentLegalAcceptance(supabase: SupabaseClient, userId: string) {
  // We invoke the public.requires_legal_acceptance RPC
  const { data: requiresAcceptance, error } = await supabase.rpc('requires_legal_acceptance', {
    p_user_id: userId
  });
  
  if (error) {
    console.error("Legal check error:", error);
    throw new Error('Failed to verify legal acceptance status');
  }
  
  if (requiresAcceptance) {
    throw new Error('LEGAL_ACCEPTANCE_REQUIRED');
  }
}
