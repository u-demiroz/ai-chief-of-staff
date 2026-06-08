'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateWeeklyBoardReport } from './actions'

export default function WeeklyBoardPage() {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await generateWeeklyBoardReport()
        setReport(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Haftalık Yönetim Kurulu (Weekly Board)</h1>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
          Dashboard'a Dön
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-900/50 rounded-full mb-4 flex items-center justify-center text-2xl">🏛</div>
            <p className="text-zinc-400">Yönetim Kurulu verileri analiz ediyor...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-sm">
          {error}
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{report.stats.completedTasks}</div>
              <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Tamamlanan Görev</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-1">{report.stats.openTasks}</div>
              <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Açık Görev</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">{report.stats.criticalIssues}</div>
              <div className="text-sm text-zinc-400 uppercase tracking-wider font-semibold">Kritik Risk</div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-900/30 bg-blue-950/10 p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-3">Yönetici Özeti</h2>
            <p className="text-zinc-300 leading-relaxed">{report.executiveSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-green-900/30 bg-green-950/10 p-6">
              <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2">Haftanın Yıldızı</h3>
              <div className="text-xl font-bold text-zinc-100 mb-2">{report.bestProject.name}</div>
              <p className="text-sm text-zinc-400">{report.bestProject.reason}</p>
            </div>

            <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-6">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Kan Kaybeden Proje</h3>
              <div className="text-xl font-bold text-zinc-100 mb-2">{report.worstProject.name}</div>
              <p className="text-sm text-zinc-400">{report.worstProject.reason}</p>
            </div>
          </div>

          <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-8 text-center mt-8 shadow-2xl shadow-purple-900/20">
            <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4">Stratejik Kurul Kararı</h2>
            <p className="text-2xl font-bold text-white">"{report.strategicDecision}"</p>
          </div>
        </div>
      )}
    </div>
  )
}
