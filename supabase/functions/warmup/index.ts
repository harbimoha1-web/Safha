// Supabase Edge Function: Warmup
// Keeps fetch-content function warm to prevent cold start delays
// Run via cron every 5 minutes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Configuration missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const results: { function: string; status: number | string; time_ms: number }[] = [];

  // Ping fetch-content to keep it warm
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        story_id: 'warmup-ping',
        url: 'https://example.com'
      }),
    });
    const elapsed = Date.now() - start;

    results.push({
      function: 'fetch-content',
      status: response.status,
      time_ms: elapsed,
    });

    console.log(`[warmup] fetch-content: ${response.status} (${elapsed}ms)`);
  } catch (err) {
    results.push({
      function: 'fetch-content',
      status: `error: ${err.message}`,
      time_ms: 0,
    });
    console.error(`[warmup] fetch-content error: ${err.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Warmup complete',
      timestamp: new Date().toISOString(),
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
