import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { TaskList } from '../projects/[id]/TaskList'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch projects
  const { data: projects } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
  
  // Fetch today's calendar events
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: todayEvents } = await supabase
    .from('calendar_events')
    .select('*, projects(title)')
    .eq('event_date', todayStr)
    .order('start_time', { ascending: true })

  // Fetch late events/tasks
  const { data: lateEvents } = await supabase
    .from('calendar_events')
    .select('*, projects(title)')
    .lt('event_date', todayStr)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true })

  // Fetch active tasks for dashboard
  const { data: dashboardTasks } = await supabase
    .from('tasks')
    .select('*, projects(title)')
    .neq('status', 'done')
    .neq('status', 'skipped')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentDecisions } = await supabase
    .from('decisions')
    .select('*, projects(title)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/projects/new" className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
            Yeni Proje Ekle
          </Link>
          <Link href="/daily-briefing" className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Daily COO Çalıştır
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Calendar */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Bugünün Takvimi</h2>
          {todayEvents && todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium text-zinc-400">{event.start_time?.slice(0,5)} - {event.end_time?.slice(0,5)}</span>
                      <h3 className="text-sm font-medium text-zinc-100 mt-1">{event.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{(event.projects as any)?.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Bugün için planlanmış iş yok.</p>
          )}
        </div>

        {/* Late Tasks */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Geciken İşler</h2>
          {lateEvents && lateEvents.length > 0 ? (
            <div className="space-y-3">
              {lateEvents.map((event) => (
                <div key={event.id} className="flex flex-col rounded-lg border border-red-900/30 bg-red-950/10 p-3">
                  <h3 className="text-sm font-medium text-zinc-100">{event.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{(event.projects as any)?.title} • {format(new Date(event.event_date), 'dd MMM yyyy', { locale: tr })}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Geciken işiniz bulunmuyor. Harika!</p>
          )}
        </div>
      </div>

      {/* Active Tasks */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">Bana Atanan Açık Görevler</h2>
        {dashboardTasks && dashboardTasks.length > 0 ? (
          <TaskList tasks={dashboardTasks as any} />
        ) : (
          <p className="text-sm text-zinc-500">Şu an için beklemede olan aktif bir göreviniz yok.</p>
        )}
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aktif Projeler</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:bg-zinc-800 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white">{project.title}</h3>
                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
                    {project.stage || 'Belirsiz'}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">{project.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>Öncelik: {project.priority_score}</span>
                  <span>{project.category}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Henüz hiç proje eklemediniz.</p>
          )}
        </div>
      </div>
    </div>
  )
}
