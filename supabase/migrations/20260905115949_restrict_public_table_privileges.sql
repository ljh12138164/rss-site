revoke all on table public.signal_articles from anon, authenticated;
revoke all on table public.ai_events from anon, authenticated;
revoke all on table public.ai_event_articles from anon, authenticated;

grant select on table public.signal_articles to anon, authenticated;
grant select on table public.ai_events to anon, authenticated;
grant select on table public.ai_event_articles to anon, authenticated;
