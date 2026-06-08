-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on profiles for select 
  using ( auth.uid() = id );

create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PROJECTS
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  title text not null,
  description text,
  category text,
  goal text,
  current_status text,
  priority_score integer default 0,
  revenue_potential integer default 0,
  effort_level integer default 0,
  risk_level integer default 0,
  stage text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);


-- 3. TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo', -- todo, in_progress, done, skipped, cancelled
  priority text default 'medium', -- low, medium, high, critical
  due_date timestamp with time zone,
  source text default 'manual', -- manual, ai_generated, war_room_decision, daily_briefing, calendar_plan
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);


-- 4. DECISIONS
create table public.decisions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  question text not null,
  context text,
  visionary_response text,
  skeptic_response text,
  operator_response text,
  judge_response text,
  final_decision text,
  scores_json jsonb,
  tasks_json jsonb,
  calendar_plan_json jsonb,
  do_not_do_json jsonb,
  status text default 'pending', -- pending, accepted, rejected, implemented, ignored
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.decisions enable row level security;

create policy "Users can view own decisions" on decisions for select using (auth.uid() = user_id);
create policy "Users can insert own decisions" on decisions for insert with check (auth.uid() = user_id);
create policy "Users can update own decisions" on decisions for update using (auth.uid() = user_id);
create policy "Users can delete own decisions" on decisions for delete using (auth.uid() = user_id);


-- 5. PROJECT NOTES
create table public.project_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_notes enable row level security;

create policy "Users can view own project notes" on project_notes for select using (auth.uid() = user_id);
create policy "Users can insert own project notes" on project_notes for insert with check (auth.uid() = user_id);
create policy "Users can update own project notes" on project_notes for update using (auth.uid() = user_id);
create policy "Users can delete own project notes" on project_notes for delete using (auth.uid() = user_id);


-- 6. CALENDAR EVENTS
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  task_id uuid references public.tasks on delete set null,
  decision_id uuid references public.decisions on delete set null,
  title text not null,
  description text,
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  status text default 'scheduled', -- scheduled, completed, skipped, rescheduled, cancelled
  source text default 'manual', -- manual, ai_daily_plan, war_room_plan, task_schedule
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.calendar_events enable row level security;

create policy "Users can view own calendar events" on calendar_events for select using (auth.uid() = user_id);
create policy "Users can insert own calendar events" on calendar_events for insert with check (auth.uid() = user_id);
create policy "Users can update own calendar events" on calendar_events for update using (auth.uid() = user_id);
create policy "Users can delete own calendar events" on calendar_events for delete using (auth.uid() = user_id);


-- Trigger for updated_at on all tables
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at before update on projects for each row execute procedure update_updated_at_column();
create trigger update_tasks_updated_at before update on tasks for each row execute procedure update_updated_at_column();
create trigger update_decisions_updated_at before update on decisions for each row execute procedure update_updated_at_column();
create trigger update_project_notes_updated_at before update on project_notes for each row execute procedure update_updated_at_column();
create trigger update_calendar_events_updated_at before update on calendar_events for each row execute procedure update_updated_at_column();
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
