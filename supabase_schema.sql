-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  weekly_capacity_hours integer default 20,
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
  health_score integer default 100,
  health_reason text,
  momentum integer default 0,
  time_to_revenue integer default 0,
  strategic_value integer default 0,
  portfolio_priority_score integer default 0,
  board_decision text default 'TBD', -- Focus, Minimum Interest, Freeze, TBD
  allocated_hours integer default 0,
  ceo_brief text,
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
  notes text,
  reason text,
  success_criteria text,
  expected_output text,
  estimated_time text,
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
  outcome text,
  implemented_at timestamp with time zone,
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
  status text default 'scheduled', -- scheduled, completed, skipped, rescheduled, cancelled, waiting
  notes text,
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

-- 7. PROJECT METRICS
create table public.project_metrics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  metric_date date not null default current_date,
  users_total integer,
  users_new_24h integer,
  users_new_7d integer,
  users_new_30d integer,
  active_users_24h integer,
  active_users_7d integer,
  active_users_30d integer,
  app_downloads_total integer,
  app_downloads_7d integer,
  app_downloads_30d integer,
  instagram_followers integer,
  instagram_followers_7d_growth integer,
  instagram_posts_30d integer,
  instagram_best_post_reach integer,
  youtube_subscribers integer,
  youtube_views_7d integer,
  revenue_total numeric,
  revenue_30d numeric,
  ad_spend_30d numeric,
  conversions_30d integer,
  retention_rate numeric,
  custom_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_metrics enable row level security;
create policy "Users can view own metrics" on project_metrics for select using (auth.uid() = user_id);
create policy "Users can insert own metrics" on project_metrics for insert with check (auth.uid() = user_id);
create policy "Users can update own metrics" on project_metrics for update using (auth.uid() = user_id);
create policy "Users can delete own metrics" on project_metrics for delete using (auth.uid() = user_id);
create trigger update_project_metrics_updated_at before update on project_metrics for each row execute procedure update_updated_at_column();

-- 8. DATA SOURCES
create table public.data_sources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  source_type text not null, -- manual, custom_api, supabase, firebase, instagram, youtube, app_store, google_play, amazon, walmart, meta_ads, other
  source_name text not null,
  api_url text,
  auth_type text,
  api_key_encrypted text,
  last_sync_at timestamp with time zone,
  last_sync_status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.data_sources enable row level security;
create policy "Users can view own data sources" on data_sources for select using (auth.uid() = user_id);
create policy "Users can insert own data sources" on data_sources for insert with check (auth.uid() = user_id);
create policy "Users can update own data sources" on data_sources for update using (auth.uid() = user_id);
create policy "Users can delete own data sources" on data_sources for delete using (auth.uid() = user_id);
create trigger update_data_sources_updated_at before update on data_sources for each row execute procedure update_updated_at_column();

-- 9. PROJECT SNAPSHOTS
create table public.project_snapshots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  project_id uuid references public.projects on delete cascade not null,
  snapshot_date timestamp with time zone default timezone('utc'::text, now()) not null,
  summary text,
  momentum_score integer default 0,
  growth_score integer default 0,
  revenue_score integer default 0,
  health_score integer default 0,
  attention_score integer default 0,
  data_completeness_score integer default 0,
  confidence_score integer default 0,
  portfolio_priority_score integer default 0,
  key_signals_json jsonb,
  missing_data_json jsonb,
  recommendation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.project_snapshots enable row level security;
create policy "Users can view own snapshots" on project_snapshots for select using (auth.uid() = user_id);
create policy "Users can insert own snapshots" on project_snapshots for insert with check (auth.uid() = user_id);
create policy "Users can delete own snapshots" on project_snapshots for delete using (auth.uid() = user_id);
