grant select on private.hot_ranking_generations to rss_site_app;

drop policy if exists hot_generations_retention_read on private.hot_ranking_generations;
drop policy if exists hot_generations_app_read on private.hot_ranking_generations;
create policy hot_generations_app_read on private.hot_ranking_generations
  for select to rss_site_app using (true);
