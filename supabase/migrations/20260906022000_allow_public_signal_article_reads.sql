drop policy if exists "Public can read articles linked to published AI events"
  on public.signal_articles;

create policy "Public can read signal articles"
  on public.signal_articles
  for select
  to anon, authenticated
  using (true);
