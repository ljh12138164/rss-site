#!/usr/bin/python3
"""Convert the reviewed pg_dump schema into the standalone PostgreSQL baseline."""
import re
import sys
from pathlib import Path


def convert(source):
    blocks = re.split(r'(?=--\n-- Name: )', source)
    kept = []
    for block in blocks:
        if re.search(r'; Type: (POLICY|ROW SECURITY|ACL|DEFAULT ACL);', block):
            continue
        if '-- Name: notify_deleted_articles(); Type: FUNCTION;' in block:
            continue
        block = re.sub(r'^\\(?:un)?restrict .*$', '', block, flags=re.M)
        block = block.replace('CREATE SCHEMA public;', 'CREATE SCHEMA IF NOT EXISTS public;')
        block = block.replace('(select auth.uid()) is null',
                              "coalesce(current_setting('app.article_admin',true),'') <> 'true'")
        block = re.sub(r"  if coalesce\(auth.jwt\(\).*?  end if;\n", '', block, flags=re.S)
        kept.append(block)
    baseline = ''.join(kept)
    if re.search(r'\b(auth|vault|net|cron)\.', baseline):
        raise ValueError('Unresolved platform dependency')
    # Restore the trigger target before its CREATE TRIGGER statement is parsed.
    marker = '-- Name: '
    notifier = '''
CREATE TABLE private.publication_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX publication_outbox_due_idx ON private.publication_outbox(next_attempt_at);
CREATE TABLE private.maintenance_state (name text PRIMARY KEY, value jsonb NOT NULL);
CREATE FUNCTION public.notify_deleted_articles() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO private.publication_outbox(payload)
    SELECT jsonb_build_object('section',section,'source',source,'id',id,'title',title)
    FROM deleted_articles;
  RETURN NULL;
END;
$$;
'''
    index = baseline.index('-- Name: ai_event_articles; Type: TABLE;')
    baseline = baseline[:index] + notifier + '\n' + baseline[index:]
    return baseline + '''
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public,private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public,private FROM PUBLIC;
'''


if __name__ == '__main__':
    Path(sys.argv[2]).write_text(convert(Path(sys.argv[1]).read_text(encoding='utf8')), encoding='utf8')
