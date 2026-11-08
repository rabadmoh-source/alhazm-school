-- Riwaq Alhazm database preparation (not applied automatically)
-- Keep private rounds and public publications in different tables.
create table if not exists public.riwaq_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.riwaq_admins enable row level security;
revoke all on public.riwaq_admins from anon;
grant select on public.riwaq_admins to authenticated;
create policy "riwaq_admin_self_read" on public.riwaq_admins for select to authenticated
using (user_id = (select auth.uid()));

create table if not exists public.riwaq_entries (
 id uuid primary key default gen_random_uuid(),
 round_type text not null check (round_type in ('learning','teaching')),
 title text not null default '',
 payload jsonb not null default '{}'::jsonb,
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.riwaq_entries enable row level security;
revoke all on public.riwaq_entries from anon;
grant select,insert,update,delete on public.riwaq_entries to authenticated;
create policy "riwaq_admin_entries_select" on public.riwaq_entries for select to authenticated using (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
create policy "riwaq_admin_entries_insert" on public.riwaq_entries for insert to authenticated with check (
 created_by = (select auth.uid()) and exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
create policy "riwaq_admin_entries_update" on public.riwaq_entries for update to authenticated using (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
) with check (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
create policy "riwaq_admin_entries_delete" on public.riwaq_entries for delete to authenticated using (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);

create table if not exists public.riwaq_publications (
 id uuid primary key default gen_random_uuid(),
 round_type text not null check (round_type in ('learning','teaching','impact')),
 title text not null,
 summary text not null default '',
 metrics jsonb not null default '{}'::jsonb,
 published_at timestamptz not null default now()
);
alter table public.riwaq_publications enable row level security;
grant select on public.riwaq_publications to anon, authenticated;
grant insert,update,delete on public.riwaq_publications to authenticated;
create policy "riwaq_publications_read" on public.riwaq_publications for select to anon, authenticated using (true);
create policy "riwaq_publications_insert_admin" on public.riwaq_publications for insert to authenticated with check (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
create policy "riwaq_publications_update_admin" on public.riwaq_publications for update to authenticated using (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
) with check (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
create policy "riwaq_publications_delete_admin" on public.riwaq_publications for delete to authenticated using (
 exists (select 1 from public.riwaq_admins a where a.user_id = (select auth.uid()))
);
-- Administrators must be explicitly provisioned by a database owner.
-- Never grant arbitrary authenticated users membership in riwaq_admins.
