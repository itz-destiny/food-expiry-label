-- Keep is_admin() out of the exposed API schema; RLS policies reference it by OID.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.is_admin() set schema private;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
