import { createClient } from '@/lib/supabase/server'
import { format, addDays, startOfToday, isBefore, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch events
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*, projects(title)')
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true })

  const today = startOfToday()
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(today, i))

  const lateEvents = events?.filter(e => isBefore(new Date(e.event_date), today)) || []

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-3xl font-bold tracking-tight">Takvim</h1>

      {lateEvents.length > 0 && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Geciken İşler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lateEvents.map(event => (
              <div key={event.id} className="rounded-lg border border-red-900/30 bg-red-950/20 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-100">{event.title}</h3>
                </div>
                <p className="text-xs text-red-300/70 mb-2">{format(new Date(event.event_date), 'dd MMMM yyyy', { locale: tr })}</p>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{(event.projects as any)?.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {next7Days.map(day => {
          const dayEvents = events?.filter(e => isSameDay(new Date(e.event_date), day)) || []
          const isToday = isSameDay(day, today)

          return (
            <div key={day.toISOString()} className={`rounded-xl border ${isToday ? 'border-zinc-700 bg-zinc-900/80 shadow-lg' : 'border-zinc-800 bg-zinc-900/30'} p-6`}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-3">
                <span className={isToday ? 'text-zinc-50' : 'text-zinc-400'}>
                  {format(day, 'EEEE, dd MMMM', { locale: tr })}
                </span>
                {isToday && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">Bugün</span>}
              </h2>

              {dayEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayEvents.map(event => (
                    <div key={event.id} className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-zinc-100">{event.title}</h3>
                          {event.start_time && (
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{event.start_time.slice(0,5)}</span>
                          )}
                        </div>
                        {event.description && <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{event.description}</p>}
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/50 mt-auto">
                        <span>{(event.projects as any)?.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">Planlanmış iş yok.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
