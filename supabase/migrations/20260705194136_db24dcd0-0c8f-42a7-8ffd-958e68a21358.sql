
-- ============ ROLES ============
create type public.app_role as enum ('admin','teacher','parent','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  child_name text,
  class_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles read own or any authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles update own"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles insert own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "user_roles read own"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles admin read all"
  on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "user_roles admin manage"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Trigger: auto-create profile + default parent role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'parent'))
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============ ADMISSIONS LEADS ============
create type public.lead_status as enum ('new','contacted','enrolled','declined');

create table public.admissions_leads (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  child_name text not null,
  child_age int,
  phone text not null,
  email text,
  program text,
  message text,
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.admissions_leads to anon, authenticated;
grant select, update, delete on public.admissions_leads to authenticated;
grant all on public.admissions_leads to service_role;
alter table public.admissions_leads enable row level security;

create policy "leads insert public"
  on public.admissions_leads for insert to anon, authenticated with check (true);
create policy "leads admin read"
  on public.admissions_leads for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "leads admin update"
  on public.admissions_leads for update to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger leads_updated_at before update on public.admissions_leads
  for each row execute function public.set_updated_at();
