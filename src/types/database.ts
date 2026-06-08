export type ProjectStage = 'Fikir' | 'MVP' | 'Test' | 'Yayında' | 'Gelir üretiyor' | 'Donduruldu' | 'Öldürüldü' | string;
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DecisionStatus = 'pending' | 'accepted' | 'rejected' | 'implemented' | 'ignored';
export type CalendarEventStatus = 'scheduled' | 'completed' | 'skipped' | 'rescheduled' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  goal: string | null;
  current_status: string | null;
  priority_score: number;
  revenue_potential: number;
  effort_level: number;
  risk_level: number;
  stage: ProjectStage | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Decision {
  id: string;
  user_id: string;
  project_id: string;
  question: string;
  context: string | null;
  visionary_response: string | null;
  skeptic_response: string | null;
  operator_response: string | null;
  judge_response: string | null;
  final_decision: string | null;
  scores_json: any | null;
  tasks_json: any | null;
  calendar_plan_json: any | null;
  do_not_do_json: any | null;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  decision_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  status: CalendarEventStatus;
  source: string;
  created_at: string;
  updated_at: string;
}
