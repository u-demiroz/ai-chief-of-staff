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
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, question, context })
      })

      if (!res.ok) {
        throw new Error('Bir hata oluştu')
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveWarRoomDecision(id, result, question, context)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
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

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-400 mb-6">
            Projenizle ilgili stratejik bir soruyu 4 farklı AI rolüne tartıştırın. Geçmiş kararlar ve notlar otomatik olarak dahil edilecektir.
          </p>

          {error && <div className="p-4 rounded-md bg-red-950/50 text-red-400 border border-red-900 text-sm">{error}</div>}

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
            disabled={loading}
            className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'AI Tartışıyor...' : 'War Room Başlat'}
          </button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-bold mb-6 text-zinc-100">War Room Sonucu</h2>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-300">Nihai Karar (Hakem)</h3>
                <div className="rounded-lg bg-zinc-800/50 p-4 border border-zinc-700">
                  <p className="text-sm text-zinc-100 font-medium leading-relaxed">{result.judge.finalDecision}</p>
                </div>
                {result.judge.doNotDo && result.judge.doNotDo.length > 0 && (
                  <div className="rounded-lg bg-red-950/20 p-4 border border-red-900/50">
                    <h4 className="text-sm font-bold text-red-400 mb-2">KESİNLİKLE YAPILMAYACAKLAR:</h4>
                    <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">
                      {result.judge.doNotDo.map((item: string, i: number) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {Object.entries(result.judge.scores || {}).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{key}</div>
                    <div className="text-xl font-bold text-zinc-100">{val as number}</div>
                  </div>
                ))}
              </div>

              {result.judge.tasks && result.judge.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-300 mb-3">Çıkarılan Görevler</h3>
                  <div className="space-y-3">
                    {result.judge.tasks.map((task: any, i: number) => (
                      <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium text-zinc-100">{task.title}</h4>
                          <span className="text-xs text-zinc-500 uppercase">{task.priority}</span>
                        </div>
                        <p className="text-xs text-zinc-400">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-800">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-blue-400">Vizyoner</h4>
                  <p className="text-xs text-zinc-400 whitespace-pre-wrap">{result.visionary}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-red-400">Şüpheci</h4>
                  <p className="text-xs text-zinc-400 whitespace-pre-wrap">{result.skeptic}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-green-400">Operasyoncu</h4>
                  <p className="text-xs text-zinc-400 whitespace-pre-wrap">{result.operator}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-md bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kararı Kaydet, Görevleri Oluştur ve Takvime Yay'}
            </button>
            <button 
              onClick={() => setResult(null)}
              disabled={loading}
              className="rounded-md border border-zinc-700 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Reddet & Yeniden Başlat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
