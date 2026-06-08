'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveDailyBriefing } from './actions'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function DailyBriefingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await fetch('/api/daily-briefing', { method: 'POST' })
        if (!res.ok) throw new Error('Bir hata oluştu')
        const data = await res.json()
        setResult(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBriefing()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDailyBriefing(result)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Daily COO Briefing</h1>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
          Dashboard'a Dön
        </Link>
      </div>

      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-zinc-800 rounded-full mb-4"></div>
            <p className="text-zinc-400">Genel Operasyon Yöneticisi projelerinizi analiz ediyor...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-sm">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-8">
            
            {/* Executive Summary */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Yönetici Özeti</h2>
              <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                <p className="text-sm text-zinc-100 font-medium leading-relaxed">{result.executiveSummary}</p>
              </div>
            </div>

            {/* Criticism */}
            {result.criticism && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">COO Eleştirisi / Uyarısı</h3>
                <div className="rounded-lg border border-orange-900/50 bg-orange-950/20 p-4">
                  <p className="text-sm text-orange-300">{result.criticism}</p>
                </div>
              </div>
            )}

            {/* Focus Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-300">Bugünün Odak Projeleri</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.focusProjects?.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <h4 className="text-sm font-bold text-zinc-100 mb-1">{p.title}</h4>
                    <p className="text-xs text-zinc-400">{p.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today Tasks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-300">Bugünün Görevleri</h3>
              <div className="space-y-3">
                {result.todayTasks?.map((t: any, i: number) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{t.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider text-zinc-500">{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Plan */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-300">Takvim Planı</h3>
              <div className="space-y-3">
                {result.calendarPlan?.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">{p.taskTitle}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{p.reason}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-xs font-bold text-zinc-300">{p.startTime} - {p.endTime}</div>
                      <div className="text-[10px] text-zinc-500">{p.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Do Not Do */}
            {result.doNotDoToday && result.doNotDoToday.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-400">Kesinlikle Yapılmayacaklar</h3>
                <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">
                  {result.doNotDoToday.map((item: string, i: number) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-md bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Günü Onayla & Takvime Ekle'}
            </button>
            <button 
              onClick={() => { setResult(null); setLoading(true); fetch('/api/daily-briefing', { method: 'POST' }).then(async r => setResult(await r.json())).finally(() => setLoading(false)) }}
              disabled={saving}
              className="rounded-md border border-zinc-700 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Yeniden Üret
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
