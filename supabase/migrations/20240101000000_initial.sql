-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'counsellor', 'admin')),
  full_name text not null,
  email text not null,
  is_online boolean default false,
  created_at timestamptz default now()
);

-- Programs table
create table if not exists public.programs (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Counsellor <-> Program mapping
create table if not exists public.counsellor_programs (
  counsellor_id uuid references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  primary key (counsellor_id, program_id)
);

-- Enquiries table
create table if not exists public.enquiries (
  id uuid primary key default uuid_generate_v4(),
  student_name text not null,
  student_email text not null,
  student_phone text not null,
  program_id uuid references public.programs(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'assigned', 'in_progress', 'resolved', 'closed')),
  assigned_counsellor_id uuid references public.profiles(id) on delete set null,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.counsellor_programs enable row level security;
alter table public.enquiries enable row level security;

-- Profiles: users can read all profiles (for counsellor display); only own row is writable
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Programs: public read, admin write
create policy "programs_select_all" on public.programs for select using (true);
create policy "programs_insert_admin" on public.programs for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Counsellor programs: read by authenticated, admin write
create policy "counsellor_programs_select" on public.counsellor_programs for select using (auth.role() = 'authenticated');
create policy "counsellor_programs_admin" on public.counsellor_programs for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Enquiries: anyone can insert; counsellors see own; admins see all
create policy "enquiries_insert_anon" on public.enquiries for insert with check (true);
create policy "enquiries_select_counsellor" on public.enquiries for select using (
  auth.uid() = assigned_counsellor_id
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "enquiries_update_counsellor" on public.enquiries for update using (
  auth.uid() = assigned_counsellor_id
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);
