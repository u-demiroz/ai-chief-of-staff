'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveWarRoomDecision } from './actions'

export default function WarRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [status, setStatus] = useState<'idle' | 'discussing' | 'judging' | 'complete'>('idle')
  const [discussion, setDiscussion] = useState<{ visionary: string, skeptic: string, operator: string } | null>(null)
  const [judgeResult, setJudgeResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('discussing')
    setError(null)
    setDiscussion(null)
    setJudgeResult(null)

    try {
      // Step 1: Discussion
      const discussRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, question, context, action: 'discuss' })
      })

      const discussData = await discussRes.json()

      if (!discussRes.ok) {
        throw new Error(discussData.error || 'Tartışma aşamasında hata oluştu')
      }

      setDiscussion({
        visionary: discussData.visionary,
        skeptic: discussData.skeptic,
        operator: discussData.operator
      })

      // Step 2: Judging
      setStatus('judging')
      const judgeRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: id, 
          question, 
          context, 
          action: 'judge',
          visionaryRes: discussData.visionary,
          skepticRes: discussData.skeptic,
          operatorRes: discussData.operator
        })
      })

      const judgeData = await judgeRes.json()

      if (!judgeRes.ok) {
        throw new Error(judgeData.error || 'Hakem karar aşamasında hata oluştu')
      }

      setJudgeResult(judgeData.judge)
      setStatus('complete')

    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWarRoomDecision(id, {
        visionary: discussion?.visionary,
        skeptic: discussion?.skeptic,
        operator: discussion?.operator,
        judge: judgeResult
      }, question, context)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
        <Link href={`/projects/${id}`} className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
          Projeye Dön
        </Link>
      </div>

      {status === 'idle' && !discussion && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-400 mb-6">
            Projenizle ilgili stratejik bir soruyu 4 farklı AI rolüne tartıştırın. Geçmiş kararlar ve notlar otomatik olarak dahil edilecektir.
          </p>

          {error && <div className="p-4 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-sm whitespace-pre-wrap">{error}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-zinc-300 mb-1">Stratejik Soru *</label>
              <input 
                id="question" 
                required 
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Örn: HookahMap'i nasıl tanıtmalıyım?"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" 
              />
            </div>

            <div>
              <label htmlFor="context" className="block text-sm font-medium text-zinc-300 mb-1">Ek Bağlam (Opsiyonel)</label>
              <textarea 
                id="context" 
                rows={3} 
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Şu an elimizde şu kadar bütçe var..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            War Room Başlat
          </button>
        </form>
      )}

      {status === 'discussing' && (
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-12 text-center space-y-4">
          <div className="animate-pulse flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-zinc-300 font-medium">Vizyoner, Şüpheci ve Operasyoncu fikirlerini hazırlıyor...</p>
          <p className="text-xs text-zinc-500">Bu işlem yaklaşık 10-15 saniye sürebilir.</p>
        </div>
      )}

      {(status === 'judging' || status === 'complete') && discussion && (
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-bold mb-6 text-zinc-100 flex items-center justify-between">
              Uzman Görüşleri
              {status === 'judging' && <span className="text-sm font-medium text-amber-400 animate-pulse bg-amber-950/30 px-3 py-1 rounded-full">Hakem Değerlendiriyor...</span>}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 rounded-lg bg-zinc-950 p-4 border border-blue-900/30">
                <h4 className="text-sm font-bold text-blue-400">Vizyoner</h4>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{discussion.visionary}</p>
              </div>
              <div className="space-y-3 rounded-lg bg-zinc-950 p-4 border border-red-900/30">
                <h4 className="text-sm font-bold text-red-400">Şüpheci</h4>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{discussion.skeptic}</p>
              </div>
              <div className="space-y-3 rounded-lg bg-zinc-950 p-4 border border-green-900/30">
                <h4 className="text-sm font-bold text-green-400">Operasyoncu</h4>
                <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{discussion.operator}</p>
              </div>
            </div>
          </div>

          {error && <div className="p-4 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-sm whitespace-pre-wrap">{error}</div>}

          {status === 'complete' && judgeResult && (
            <div className="rounded-xl border border-amber-900/50 bg-zinc-900/50 p-6">
              <h2 className="text-xl font-bold mb-6 text-amber-400">Nihai Karar (Hakem)</h2>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="rounded-lg bg-zinc-800/50 p-5 border border-zinc-700">
                    <p className="text-sm text-zinc-100 font-medium leading-relaxed">{judgeResult.finalDecision}</p>
                  </div>
                  {judgeResult.doNotDo && judgeResult.doNotDo.length > 0 && (
                    <div className="rounded-lg bg-red-950/20 p-4 border border-red-900/50">
                      <h4 className="text-sm font-bold text-red-400 mb-2">KESİNLİKLE YAPILMAYACAKLAR:</h4>
                      <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">
                        {judgeResult.doNotDo.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {Object.entries(judgeResult.scores || {}).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{key}</div>
                      <div className="text-xl font-bold text-zinc-100">{val as number}</div>
                    </div>
                  ))}
                </div>

                {judgeResult.tasks && judgeResult.tasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-300 mb-3">Çıkarılan Görevler</h3>
                    <div className="space-y-3">
                      {judgeResult.tasks.map((task: any, i: number) => (
                        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-medium text-zinc-100">{task.title}</h4>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{task.priority}</span>
                          </div>
                          <p className="text-xs text-zinc-400">{task.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4 pt-6 border-t border-zinc-800">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-md bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kararı Kaydet, Görevleri Oluştur ve Takvime Yay'}
                </button>
                <button 
                  onClick={() => { setStatus('idle'); setDiscussion(null); setJudgeResult(null); }}
                  disabled={saving}
                  className="rounded-md border border-zinc-700 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Reddet & Yeniden Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
