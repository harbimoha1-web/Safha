-- Safha Cron Jobs Configuration
-- ========================================
-- HOW TO SET UP:
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Search for "pg_cron" and enable it
-- 3. IMPORTANT: Replace all instances of PROJECT_REF below with your project ID
--    Your project ref can be found in: Project Settings > General
--    Current hardcoded ref: qnibkvemxmhjgzydstlg
-- 4. Go to SQL Editor and run this entire file
-- ========================================
--
-- WARNING: HARDCODED PROJECT URL
-- ================================
-- pg_cron with pg_net requires literal URLs - it cannot use runtime variables.
-- If you migrate to a new Supabase project, you MUST update this file.
--
-- To find and replace all URLs, run this search:
--   grep -n "qnibkvemxmhjgzydstlg" supabase/CRON_JOBS.sql
--
-- Lines with hardcoded URLs: 61, 84, 107
-- ========================================

-- Enable pg_cron extension (required - enable via Dashboard first!)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- CRON JOB 1: Reset Weekly Stats
-- Runs every Sunday at midnight Saudi time (21:00 UTC Saturday)
-- ============================================
SELECT cron.unschedule('reset-weekly-stats') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-weekly-stats'
);

SELECT cron.schedule(
  'reset-weekly-stats',
  '0 21 * * 6',  -- Every Saturday at 21:00 UTC (Sunday 00:00 Riyadh)
  $$SELECT reset_weekly_stats()$$
);

-- ============================================
-- CRON JOB 2: Reset Monthly Stats
-- Runs on 1st of each month at midnight Saudi time
-- ============================================
SELECT cron.unschedule('reset-monthly-stats') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-stats'
);

SELECT cron.schedule(
  'reset-monthly-stats',
  '0 21 1 * *',  -- 1st of month at 21:00 UTC (midnight Riyadh)
  $$SELECT reset_monthly_stats()$$
);

-- ============================================
-- CRON JOB 3: Fetch RSS Feeds
-- Runs every 30 minutes to fetch new articles
-- NOTE: Replace YOUR_PROJECT_REF with your actual project ref (qnibkvemxmhjgzydstlg)
-- ============================================

-- First, enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('fetch-rss-feeds') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'fetch-rss-feeds'
);

SELECT cron.schedule(
  'fetch-rss-feeds',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  )
  $$
);

-- ============================================
-- CRON JOB 4: Process Articles (AI Summarization)
-- Runs every 15 minutes to process pending articles
-- ============================================
SELECT cron.unschedule('process-articles') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-articles'
);

SELECT cron.schedule(
  'process-articles',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/process-articles',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  )
  $$
);

-- ============================================
-- CRON JOB 5: Generate Daily Digest
-- Runs every day at 6 AM Saudi time (3:00 UTC)
-- ============================================
SELECT cron.unschedule('generate-daily-digest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-digest'
);

SELECT cron.schedule(
  'generate-daily-digest',
  '0 3 * * *',  -- Every day at 3:00 UTC (6:00 AM Riyadh)
  $$
  SELECT net.http_post(
    url := 'https://qnibkvemxmhjgzydstlg.supabase.co/functions/v1/generate-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"type": "daily"}'::jsonb
  )
  $$
);

-- ============================================
-- VERIFY CRON JOBS
-- ============================================
SELECT
  jobid,
  jobname,
  schedule,
  command
FROM cron.job
ORDER BY jobname;

-- ============================================
-- USEFUL COMMANDS
-- ============================================

-- View cron job history (last 50 runs):
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Manually trigger a job:
-- SELECT cron.run_job('fetch-rss-feeds');

-- Disable a job temporarily:
-- UPDATE cron.job SET active = false WHERE jobname = 'fetch-rss-feeds';

-- Re-enable a job:
-- UPDATE cron.job SET active = true WHERE jobname = 'fetch-rss-feeds';
