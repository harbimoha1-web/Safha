-- Add RSS feed fetching cron job
-- Runs every 30 minutes to keep content fresh

-- Schedule RSS feed fetching
SELECT cron.schedule(
  'fetch-rss-feeds',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule article processing (runs after RSS fetch)
-- Offset by 5 minutes to allow RSS fetch to complete
SELECT cron.schedule(
  'process-articles',
  '5,35 * * * *',  -- At :05 and :35 past each hour (5 min after RSS fetch)
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/process-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{"limit": 25}'::jsonb
  );
  $$
);

-- Add comments for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler - RSS fetching (30min) + article processing (30min offset)';
