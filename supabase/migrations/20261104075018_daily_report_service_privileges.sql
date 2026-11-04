-- Supabase default privileges may already grant service_role ALL on new tables.
-- Revoke first so the published report table has only its intended operations.
revoke all on public.daily_reports from service_role;
grant select, insert on public.daily_reports to service_role;
