// This runs in Deno (Supabase Edge Functions)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenRouterProvider } from './provider.ts';
import { AIPromptContext } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const body: AIPromptContext = await req.json();

    // Init provider (Only OpenRouter implemented for now)
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) throw new Error('AI Provider not configured on server');

    const provider = new OpenRouterProvider({
      apiKey: openRouterApiKey,
      defaultModel: 'anthropic/claude-3-haiku',
    });

    // 1. We should track prompt generation here
    // ...

    // 2. We trigger the provider
    // If streaming was requested, we would return a readable stream
    // For simplicity in this mock, we just use standard generate
    const response = await provider.generate(body);

    // 3. Save generation history and track tokens to database
    await supabase.from('prompt_history').insert({
      workspace_id: body.taskContext.workspace,
      user_id: user.id,
      prompt_text: body.systemPrompt + '\n' + body.developerPrompt,
      context_used: body.taskContext,
    });

    // 4. Return response to client
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
