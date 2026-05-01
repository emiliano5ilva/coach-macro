-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create the profiles table if it doesn't exist
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  profile_data jsonb,
  schedule    jsonb,
  wprefs      jsonb,
  updated_at  timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Drop existing policies to avoid conflicts, then recreate them
drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;
drop policy if exists "Users can upsert own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 4. Also create the supporting tables if they don't exist
create table if not exists public.food_logs (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  logged_at  date not null,
  entry      jsonb,
  created_at timestamptz default now()
);

alter table public.food_logs enable row level security;
drop policy if exists "Users can manage own food logs" on public.food_logs;
create policy "Users can manage own food logs"
  on public.food_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.workout_logs (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  logged_at  date not null,
  entry      jsonb,
  created_at timestamptz default now()
);

alter table public.workout_logs enable row level security;
drop policy if exists "Users can manage own workout logs" on public.workout_logs;
create policy "Users can manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.weight_checkins (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  weight     numeric not null,
  unit       text,
  checked_at date not null,
  created_at timestamptz default now()
);

alter table public.weight_checkins enable row level security;
drop policy if exists "Users can manage own weight checkins" on public.weight_checkins;
create policy "Users can manage own weight checkins"
  on public.weight_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
