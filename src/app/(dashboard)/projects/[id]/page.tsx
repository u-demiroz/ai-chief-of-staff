import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { TaskList } from './TaskList'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()

  if (!project) {
    notFound()
  }

  const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false })
  const { data: decisions } = await supabase.from('decisions').select('*').eq('project_id', id).order('created_at', { ascending: false })
  const { data: notes } = await supabase.from('project_notes').select('*').eq('project_id', id).order('created_at', { ascending: false })
  
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: events } = await supabase.from('calendar_events').select('*').eq('project_id', id).gte('event_date', todayStr).order('event_date', { ascending: true })

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{project.category} • {project.stage}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/projects/${project.id}/war-room`} className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
            War Room Başlat
          </Link>
          <Link href={`/projects/${project.id}/metrics`} className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Metrikler
          </Link>
          <Link href={`/projects/${project.id}/edit`} className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Düzenle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Project Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Proje Özeti</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-zinc-500 block mb-1">Açıklama</span>
                <p className="text-sm text-zinc-300">{project.description || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 block mb-1">Hedef</span>
                <p className="text-sm text-zinc-300">{project.goal || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 block mb-1">Mevcut Durum</span>
                <p className="text-sm text-zinc-300">{project.current_status || '-'}</p>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Görevler</h2>
              <button className="text-sm font-medium text-zinc-400 hover:text-zinc-100">Görev Ekle</button>
            </div>
            {tasks && tasks.length > 0 ? (
              <TaskList tasks={tasks} projectId={id} />
            ) : (
              <p className="text-sm text-zinc-500">Bu projeye ait görev bulunmuyor.</p>
            )}
          </div>

          {/* Decisions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Karar Geçmişi (War Room)</h2>
            {decisions && decisions.length > 0 ? (
              <div className="space-y-4">
                {decisions.map(decision => (
                  <Link href={`/projects/${project.id}/decisions/${decision.id}`} key={decision.id} className="block rounded-lg border border-zinc-800 bg-zinc-950 p-4 hover:bg-zinc-800/50">
                    <h3 className="text-sm font-medium text-zinc-100 mb-2">{decision.question}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">{decision.final_decision}</p>
                    <div className="mt-3 text-xs text-zinc-500 flex justify-between">
                      <span>{format(new Date(decision.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                      <span>Durum: {decision.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Henüz War Room kararı alınmamış.</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Calendar */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Yaklaşan İşler</h2>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <h3 className="text-sm font-medium text-zinc-100">{event.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {format(new Date(event.event_date), 'dd MMM yyyy', { locale: tr })} 
                      {event.start_time && ` • ${event.start_time.slice(0,5)}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Takvime eklenmiş yaklaşan iş yok.</p>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Notlar & Hafıza</h2>
              <button className="text-sm font-medium text-zinc-400 hover:text-zinc-100">Not Ekle</button>
            </div>
            {notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-sm text-zinc-300">{note.content}</p>
                    <span className="text-xs text-zinc-500 mt-2 block">{format(new Date(note.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Proje notu bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
