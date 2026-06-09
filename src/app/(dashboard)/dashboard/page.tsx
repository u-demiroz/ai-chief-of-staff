import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { EventList } from './EventList'
import { LessonsLearnedList } from './LessonsLearnedList'
import { RunPortfolioManagerButton } from './RunPortfolioManagerButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch projects and sort by portfolio priority
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('portfolio_priority_score', { ascending: false })
    
  // Fetch latest snapshots for each project
  const { data: latestSnapshots } = await supabase
    .from('project_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })

  // Map latest snapshot to projects
  const projectsWithSnapshots = projects?.map(p => {
    const snapshot = latestSnapshots?.find(s => s.project_id === p.id)
    return { ...p, snapshot }
  }) || []

  // Group projects
  const focusProjects = projectsWithSnapshots.filter(p => p.board_decision === 'Focus')
  const minInterestProjects = projectsWithSnapshots.filter(p => p.board_decision === 'Minimum Interest')
  const frozenProjects = projectsWithSnapshots.filter(p => p.board_decision === 'Freeze')
  const tbdProjects = projectsWithSnapshots.filter(p => p.board_decision === 'TBD' || !p.board_decision)

  // Veto Rule: If there are too many open tasks or frozen projects, Veto new projects
  // In a real scenario, this is calculated by the AI. For the page render, we can use a basic heuristic.
  const totalOpenTasks = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'done')
  const isVetoed = (totalOpenTasks.count || 0) > 30 || frozenProjects.length > 2

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Board</h1>
          <p className="text-sm text-zinc-400 mt-2">Kapasite ve Dikkat Yönetimi Merkezi</p>
        </div>
        <div className="flex gap-3">
          <RunPortfolioManagerButton />
          <Link href="/daily-briefing" className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Daily COO
          </Link>
        </div>
      </div>

      {/* Fetch Events Data Down Here (moving the queries down to avoid clutter at top) */}
      {(() => { return null; })()}

      {/* PORTFOLIO MANAGEMENT SECTION (THE NEW CORE) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Bu Haftanın Odak Planı</h2>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Portfolio Priority Score</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FOCUS PROJECTS */}
          <div className="rounded-xl border border-blue-900/50 bg-blue-950/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span> Odaklan
              </h3>
            </div>
            <div className="space-y-3">
              {focusProjects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors border border-zinc-800 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-zinc-100">{p.title}</h4>
                    <span className="text-2xl font-black text-blue-500">{p.portfolio_priority_score}</span>
                  </div>
                  
                  {/* METRICS SCORES BAR */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[10px] font-medium bg-zinc-950 px-2 py-1 rounded text-zinc-400">
                      Momentum: <span className={p.momentum > 70 ? 'text-green-400' : 'text-zinc-300'}>{p.momentum}</span>
                    </span>
                    {p.snapshot?.data_completeness_score !== undefined && (
                      <span className="text-[10px] font-medium bg-zinc-950 px-2 py-1 rounded text-zinc-400">
                        Veri: <span className={p.snapshot.data_completeness_score > 70 ? 'text-blue-400' : 'text-amber-500'}>%{p.snapshot.data_completeness_score}</span>
                      </span>
                    )}
                  </div>

                  {/* KEY SIGNALS */}
                  {p.snapshot?.key_signals_json && p.snapshot.key_signals_json.length > 0 && (
                    <div className="mb-3 pl-2 border-l-2 border-zinc-700">
                      {p.snapshot.key_signals_json.slice(0, 2).map((sig: string, i: number) => (
                        <p key={i} className="text-[11px] text-zinc-400">• {sig}</p>
                      ))}
                    </div>
                  )}

                  {/* AI REASONING / RECOMMENDATION */}
                  <div className="mt-3 p-3 bg-blue-950/20 rounded-md border border-blue-900/30">
                    <div className="text-xs font-bold text-blue-400 mb-1">Karar: {p.allocated_hours} Saat</div>
                    <p className="text-xs text-zinc-300">{p.health_reason}</p>
                    {p.snapshot?.recommendation && (
                      <p className="text-xs text-blue-300 mt-2 font-medium">💡 Öneri: {p.snapshot.recommendation}</p>
                    )}
                  </div>
                </Link>
              ))}
              {focusProjects.length === 0 && <p className="text-sm text-zinc-500">Board kararı bekleniyor.</p>}
            </div>
          </div>

          {/* MINIMUM INTEREST */}
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-amber-500">Minimum İlgi</h3>
            </div>
            <div className="space-y-3">
              {minInterestProjects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg bg-zinc-900 p-4 hover:bg-zinc-800 transition-colors border border-zinc-800 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-zinc-300">{p.title}</h4>
                    <span className="text-lg font-bold text-amber-500/70">{p.portfolio_priority_score}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[10px] font-medium bg-zinc-950 px-2 py-1 rounded text-zinc-500">
                      Momentum: <span className="text-zinc-400">{p.momentum}</span>
                    </span>
                    {p.snapshot?.data_completeness_score !== undefined && (
                      <span className="text-[10px] font-medium bg-zinc-950 px-2 py-1 rounded text-zinc-500">
                        Veri: <span className="text-zinc-400">%{p.snapshot.data_completeness_score}</span>
                      </span>
                    )}
                  </div>

                  {p.snapshot?.key_signals_json && p.snapshot.key_signals_json.length > 0 && (
                    <div className="mb-3 pl-2 border-l-2 border-zinc-700 opacity-70">
                      {p.snapshot.key_signals_json.slice(0, 1).map((sig: string, i: number) => (
                        <p key={i} className="text-[10px] text-zinc-500">• {sig}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 p-2 bg-amber-950/10 rounded-md border border-amber-900/30">
                    <div className="text-xs font-bold text-amber-500/70 mb-1">Karar: {p.allocated_hours} Saat</div>
                    <p className="text-[11px] text-zinc-400">{p.health_reason}</p>
                  </div>
                </Link>
              ))}
              {minInterestProjects.length === 0 && <p className="text-sm text-zinc-500">Proje bulunmuyor.</p>}
            </div>
          </div>

          {/* FREEZE */}
          <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-5 opacity-70">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                Dondur ❄️
              </h3>
            </div>
            <div className="space-y-3">
              {frozenProjects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg bg-zinc-900 p-3 hover:bg-zinc-800 transition-colors border border-zinc-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-zinc-400 line-through decoration-red-500/50">{p.title}</h4>
                    <span className="text-sm font-bold text-red-500/50">{p.portfolio_priority_score}</span>
                  </div>
                  <p className="text-[11px] text-red-400/70 mt-1 italic">"{p.health_reason}"</p>
                </Link>
              ))}
              {frozenProjects.length === 0 && <p className="text-sm text-zinc-500">Dondurulan proje yok.</p>}
            </div>
          </div>
        </div>

        {/* TBD PROJECTS (Newly added, no board decision yet) */}
        {tbdProjects.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border border-dashed border-zinc-700">
            <p className="text-sm text-zinc-400 mb-2">Henüz Executive Board tarafından değerlendirilmeyen projeler:</p>
            <div className="flex gap-2">
              {tbdProjects.map(p => (
                <Link key={p.id} href={`/projects/${p.id}`} className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-300 hover:bg-zinc-700">{p.title}</Link>
              ))}
            </div>
          </div>
        )}

        {/* VETO SECTION */}
        <div className={`mt-6 p-4 rounded-xl border ${isVetoed ? 'bg-red-950/20 border-red-900/50' : 'bg-green-950/10 border-green-900/30'} flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold ${isVetoed ? 'text-red-400' : 'text-green-400'}`}>
              Yeni Proje Açma Statüsü: {isVetoed ? 'VETO EDİLDİ' : 'AÇIK'}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              {isVetoed 
                ? `Şu an ${totalOpenTasks.count} açık göreviniz var. Odaklanmanızı kaybetmemek için Executive Board yeni proje açılışını durdurdu.` 
                : 'Şu anki portföy sağlığınız yeni bir proje yükünü kaldırabilir seviyede.'}
            </p>
          </div>
          <Link 
            href="/projects/new" 
            className={`px-4 py-2 rounded-md text-sm font-bold ${isVetoed ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed pointer-events-none' : 'bg-white text-black hover:bg-zinc-200'}`}
          >
            Yeni Proje Ekle
          </Link>
        </div>
      </div>

      <hr className="border-zinc-800" />

      {/* OPERATIONS SECTION (TASKS) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Operasyon (Execution)</h2>
        
        {/* We moved the event fetching here */}
        {await (async () => {
          const todayStr = format(new Date(), 'yyyy-MM-dd')
          const { data: todayEvents } = await supabase.from('calendar_events').select('*, projects(title)').eq('event_date', todayStr).order('start_time', { ascending: true })
          const { data: waitingEvents } = await supabase.from('calendar_events').select('*, projects(title)').eq('status', 'waiting').order('updated_at', { ascending: false })
          const { data: pendingDecisions } = await supabase.from('decisions').select('*, projects(title)').eq('status', 'accepted').order('created_at', { ascending: true })

          return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-xl font-semibold mb-4">Bugünün Takvimi</h2>
                <EventList events={todayEvents as any} />
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-purple-400">Takip Edilen (Bekleyen) İşler</h2>
                  {waitingEvents && waitingEvents.length > 0 ? (
                    <EventList events={waitingEvents as any} />
                  ) : (
                    <p className="text-sm text-zinc-500">Şu an başkasından haber beklediğiniz bir iş yok.</p>
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
            </div>
          )
        })()}
      </div>

    </div>
  )
}
