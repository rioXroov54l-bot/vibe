CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('vibe-retention','17 3 * * *','select vibe_private.maintenance()');
