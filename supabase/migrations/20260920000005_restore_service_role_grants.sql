-- Restore full service_role privileges on application schemas.
-- This is required for server-side account deletion and maintenance.

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

grant usage on schema vibe_private to service_role;
grant all privileges on all functions in schema vibe_private to service_role;
