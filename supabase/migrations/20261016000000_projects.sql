-- Saved circuits, up to 10 per user.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  circuit jsonb not null check (jsonb_typeof(circuit) = 'object' and pg_column_size(circuit) < 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

create policy "Users read their projects" on public.projects
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their projects" on public.projects
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their projects" on public.projects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their projects" on public.projects
  for delete to authenticated using ((select auth.uid()) = user_id);

-- at most 10 projects per user (the lock serialises concurrent inserts of one user)
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if (select count(*) from public.projects where user_id = new.user_id) >= 10 then
    raise exception 'project_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_limit on public.projects;
create trigger projects_limit before insert on public.projects
  for each row execute function public.enforce_project_limit();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

