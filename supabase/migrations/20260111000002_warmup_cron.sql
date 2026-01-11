-- Enable required extensions for HTTP requests and cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule warmup function to run every 5 minutes
-- This keeps fetch-content warm and prevents cold start delays
SELECT cron.schedule(
  'warmup-edge-functions',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/warmup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for warmup cron';
