-- Each source belongs to one section. Avoid underestimating source + section filters.
create statistics if not exists public.signal_articles_section_source_dependencies (dependencies)
  on section, source from public.signal_articles;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_stats_ext
    where statistics_schemaname = 'public'
      and statistics_name = 'signal_articles_section_source_dependencies'
      and dependencies is not null
  ) then
    analyze public.signal_articles (section, source);
  end if;
end $$;
