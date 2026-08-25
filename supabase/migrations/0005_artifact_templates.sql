-- 0005_artifact_templates.sql
-- Adds structured-artifact columns to playground_sessions. Both nullable;
-- null means "render the Generic fallback from `output`" — covers both a
-- validation failure on a fresh generation and every pre-existing row.
alter table public.playground_sessions
  add column if not exists template_type text,
  add column if not exists structured jsonb;
