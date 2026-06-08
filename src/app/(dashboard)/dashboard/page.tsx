import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { EventList } from './EventList'
import { HealthUpdateButton } from './HealthUpdateButton'
import { LessonsLearnedList } from './LessonsLearnedList'

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
    .neq('status', 'waiting')
    .order('event_date', { ascending: true })

  // Fetch waiting (tracked) events
  const { data: waitingEvents } = await supabase
    .from('calendar_events')
    .select('*, projects(title)')
    .eq('status', 'waiting')
    .order('updated_at', { ascending: false })

  const { data: pendingDecisions } = await supabase
    .from('decisions')
    .select('*, projects(title)')
    .eq('status', 'accepted')
    .order('created_at', { ascending: true })

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
          <Link href="/weekly-board" className="rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-zinc-700 transition-colors">
            Haftalık Yönetim Kurulu
          </Link>
          <Link href="/daily-briefing" className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Daily COO Çalıştır
          </Link>
          <Link href="/projects/new" className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
            Yeni Proje
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Calendar */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Bugünün Takvimi</h2>
          <EventList events={todayEvents as any} />
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

      {/* Waiting Tasks & Lessons Learned */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Takip Edilen (Bekleyen) İşler</h2>
          {waitingEvents && waitingEvents.length > 0 ? (
            <EventList events={waitingEvents as any} />
          ) : (
            <p className="text-sm text-zinc-500">Şu an başkasından haber veya sonuç beklediğiniz bir iş yok.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Sonuç Bekleyen Kararlar (Hafıza)</h2>
          {pendingDecisions && pendingDecisions.length > 0 ? (
            <LessonsLearnedList decisions={pendingDecisions as any} />
          ) : (
            <p className="text-sm text-zinc-500">Uygulanıp sonucu beklenen bir karar yok.</p>
          )}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Aktif Projeler & Sağlık Durumu</h2>
          <HealthUpdateButton />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:bg-zinc-800 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white">{project.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    project.health_score > 80 ? 'bg-green-900/50 text-green-300' :
                    project.health_score > 50 ? 'bg-amber-900/50 text-amber-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    Sağlık: {project.health_score ?? 100}/100
                  </span>
                </div>
                {project.health_reason ? (
                  <p className="text-sm text-zinc-400 line-clamp-2 italic">{project.health_reason}</p>
                ) : (
                  <p className="text-sm text-zinc-400 line-clamp-2">{project.description}</p>
                )}
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
