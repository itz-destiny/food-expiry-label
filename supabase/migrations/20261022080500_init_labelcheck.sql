-- LabelCheck: Intelligent Food Label Verification and Consumer Awareness System

-- Profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'consumer' check (role in ('consumer', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Every new auth user gets a consumer profile. Roles are only changed from the
-- dashboard / SQL editor, never by the user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

create policy "Users read own profile, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- Products (the registry the verification engine searches) -------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  size text,
  manufacturer text,
  barcode text,
  nafdac_number text,
  expiry_date date,
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index products_barcode_idx on public.products (barcode);
create index products_nafdac_idx on public.products (nafdac_number);
create index products_created_by_idx on public.products (created_by);
alter table public.products enable row level security;

create policy "Anyone can read products"
  on public.products for select to anon, authenticated using (true);
create policy "Admins insert products"
  on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update products"
  on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete products"
  on public.products for delete to authenticated using ((select public.is_admin()));

-- Reports (consumer evidence) ---------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_name text not null,
  product_key text not null,
  barcode text,
  nafdac_number text,
  expiry_date date,
  store_location text not null,
  observed_at timestamptz,
  label_description text not null,
  photo_path text,
  analysis_result text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Under Review', 'Confirmed Suspicious', 'Action Taken', 'Dismissed')),
  action_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index reports_user_idx on public.reports (user_id);
create index reports_product_key_idx on public.reports (product_key);
create index reports_barcode_idx on public.reports (barcode);
create index reports_nafdac_idx on public.reports (nafdac_number);
create index reports_created_idx on public.reports (created_at desc);
alter table public.reports enable row level security;

create policy "Reporters and admins read reports"
  on public.reports for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Signed-in users file pending reports"
  on public.reports for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'Pending');
create policy "Admins review reports"
  on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete reports"
  on public.reports for delete to authenticated using ((select public.is_admin()));

-- Public, anonymised view of reports for the "reported as suspicious?" check and
-- community alerts. No reporter identity or photos.
create function public.report_signals()
returns table (
  id uuid,
  product_name text,
  product_key text,
  barcode text,
  nafdac_number text,
  store_location text,
  label_description text,
  status text,
  action_note text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select id, product_name, product_key, barcode, nafdac_number, store_location,
         label_description, status, action_note, created_at
  from public.reports
  where status <> 'Dismissed'
  order by created_at desc
  limit 1000;
$$;

revoke execute on function public.report_signals() from public;
grant execute on function public.report_signals() to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Evidence photos ----------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Files live under "<user id>/<file>".
create policy "Users upload evidence to their folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners and admins view evidence"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
