begin;
select plan(10);

select is(public.article_has_indexable_content('炒饭问题', '求经验分享！', '<p>求经验分享！</p>'), false, 'question requesting answers is a placeholder');
select is(public.article_has_indexable_content('Story', null, '<a href="https://example.com">Comments on Hacker News</a> | <a href="https://example.com">Source</a>'), false, 'link-only story is excluded');
select is(public.article_has_indexable_content('报道', null, '<p>记者：张三</p><p>编导：李四</p><p>新华社音视频部制作</p>'), false, 'credits are not a report body');
select is(public.article_has_indexable_content('产品发布', null, '<p>模型今日开放下载。</p>'), true, 'complete short news is retained');
select is(public.article_has_indexable_content('公告', '明日恢复交易。', null), true, 'complete plain summary is retained');
select is(public.article_has_indexable_content('视频', null, '<div data-cctv-video="0123456789abcdef0123456789abcdef"></div>'), true, 'supported video is retained');
select is(public.article_has_indexable_content('标题', '标题', null), false, 'title-only page is excluded');
select is(public.article_has_indexable_content('标题', null, '<script>hidden words</script>'), false, 'hidden script does not qualify');

insert into public.signal_articles(section,source,source_key,title,url,summary,content_html)
values ('news','xinhua','seo-indexability-test','测试短讯','https://example.com/seo-test',null,'<p>测试短讯已正式发布。</p>');
select is((select is_indexable from public.signal_articles where source='xinhua' and source_key='seo-indexability-test'), true, 'insert automatically calculates eligibility');
update public.signal_articles set content_html='<p>记者：张三</p>',summary=null where source='xinhua' and source_key='seo-indexability-test';
select is((select is_indexable from public.signal_articles where source='xinhua' and source_key='seo-indexability-test'), false, 'editing automatically recalculates eligibility');

select * from finish();
rollback;
