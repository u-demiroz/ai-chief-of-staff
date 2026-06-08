'use client'

import { useState, use, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveWarRoomDecision } from './actions'

export default function WarRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [status, setStatus] = useState<'idle' | 'visionary' | 'skeptic' | 'operator' | 'judging' | 'complete'>('idle')
  const [discussion, setDiscussion] = useState<{ visionary?: string, skeptic?: string, operator?: string }>({})
  const [judgeResult, setJudgeResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [status, discussion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDiscussion({})
    setJudgeResult(null)

    try {
      // 1. Visionary
      setStatus('visionary')
      const vRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, question, context, action: 'visionary' })
      })
      const vData = await vRes.json()
      if (!vRes.ok) throw new Error(typeof vData.error === 'string' ? vData.error : JSON.stringify(vData.error || vData))
      setDiscussion(prev => ({ ...prev, visionary: vData.visionary }))

      // 2. Skeptic
      setStatus('skeptic')
      const sRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, question, context, action: 'skeptic', visionaryRes: vData.visionary })
      })
      const sData = await sRes.json()
      if (!sRes.ok) throw new Error(typeof sData.error === 'string' ? sData.error : JSON.stringify(sData.error || sData))
      setDiscussion(prev => ({ ...prev, skeptic: sData.skeptic }))

      // 3. Operator
      setStatus('operator')
      const oRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, question, context, action: 'operator', visionaryRes: vData.visionary, skepticRes: sData.skeptic })
      })
      const oData = await oRes.json()
      if (!oRes.ok) throw new Error(typeof oData.error === 'string' ? oData.error : JSON.stringify(oData.error || oData))
      setDiscussion(prev => ({ ...prev, operator: oData.operator }))

      // 4. Judge
      setStatus('judging')
      const jRes = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: id, 
          question, 
          context, 
          action: 'judge',
          visionaryRes: vData.visionary,
          skepticRes: sData.skeptic,
          operatorRes: oData.operator
        })
      })
      const jData = await jRes.json()
      if (!jRes.ok) throw new Error(typeof jData.error === 'string' ? jData.error : JSON.stringify(jData.error || jData))

      setJudgeResult(jData.judge)
      setStatus('complete')

    } catch (err: any) {
      setError(typeof err.message === 'string' ? err.message : JSON.stringify(err.message || err))
      // Stop progressing but keep UI visible
      setStatus(prev => prev === 'idle' ? 'idle' : prev)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveWarRoomDecision(id, {
        visionary: discussion.visionary,
        skeptic: discussion.skeptic,
        operator: discussion.operator,
        judge: judgeResult
      }, question, context)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  const hasAnyDiscussion = discussion.visionary || discussion.skeptic || discussion.operator
  const isWorking = ['visionary', 'skeptic', 'operator', 'judging'].includes(status)

  const LoadingIndicator = ({ text, colorClass }: { text: string, colorClass: string }) => (
    <div className={`flex items-center space-x-3 p-4 rounded-lg bg-zinc-950/50 border border-zinc-800 animate-pulse`}>
      <div className="flex space-x-1">
        <div className={`w-2 h-2 rounded-full ${colorClass} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 rounded-full ${colorClass} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 rounded-full ${colorClass} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm font-medium text-zinc-400">{text}</span>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
        <Link href={`/projects/${id}`} className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
          Projeye Dön
        </Link>
      </div>

      {status === 'idle' && !hasAnyDiscussion && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-400 mb-6">
            Projenizle ilgili stratejik bir soruyu 4 farklı AI rolüne tartıştırın. Modeller birbirlerinin dediklerini okuyup eleştirerek nihai bir karar çıkaracaktır.
          </p>

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
            Tartışmayı Başlat
          </button>
        </form>
      )}

      {(hasAnyDiscussion || isWorking) && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center justify-between pb-4 border-b border-zinc-800/50">
              Canlı Tartışma Odası
            </h2>
            
            <div className="space-y-6">
              
              {/* VİZYONER */}
              {(discussion.visionary || status === 'visionary') && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400 text-lg">💡</div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-blue-400">Vizyoner</h4>
                    {discussion.visionary ? (
                      <div className="rounded-2xl rounded-tl-none bg-blue-950/20 border border-blue-900/30 p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {discussion.visionary}
                      </div>
                    ) : (
                      <LoadingIndicator text="Fırsatları ve stratejiyi kurguluyor..." colorClass="bg-blue-500" />
                    )}
                  </div>
                </div>
              )}

              {/* ŞÜPHECİ */}
              {(discussion.skeptic || status === 'skeptic') && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-red-400 text-lg">⚖️</div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-red-400">Şüpheci</h4>
                    {discussion.skeptic ? (
                      <div className="rounded-2xl rounded-tl-none bg-red-950/20 border border-red-900/30 p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {discussion.skeptic}
                      </div>
                    ) : (
                      <LoadingIndicator text="Vizyoner'in planını okuyor ve açıkları arıyor..." colorClass="bg-red-500" />
                    )}
                  </div>
                </div>
              )}

              {/* OPERASYONCU */}
              {(discussion.operator || status === 'operator') && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center flex-shrink-0 text-green-400 text-lg">⚙️</div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-green-400">Operasyoncu</h4>
                    {discussion.operator ? (
                      <div className="rounded-2xl rounded-tl-none bg-green-950/20 border border-green-900/30 p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {discussion.operator}
                      </div>
                    ) : (
                      <LoadingIndicator text="İkisini harmanlayıp gerçekçi bir eylem planı çıkarıyor..." colorClass="bg-green-500" />
                    )}
                  </div>
                </div>
              )}

              {/* HAKEM YÜKLENİYOR */}
              {status === 'judging' && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 text-lg">🧑‍⚖️</div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-amber-400">Hakem (Karar)</h4>
                    <LoadingIndicator text="Tüm tartışmayı okuyup nihai kararı ve görevleri belirliyor..." colorClass="bg-amber-500" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {error && (
            <div className="p-6 rounded-xl bg-red-950/20 border border-red-900/50 space-y-4">
              <div className="text-red-400 text-sm font-bold">Hata Oluştu:</div>
              <div className="text-red-400 text-sm whitespace-pre-wrap">{error}</div>
              <button 
                onClick={() => { setStatus('idle'); setDiscussion({}); setJudgeResult(null); setError(null); }}
                className="rounded-md bg-red-900/50 px-6 py-2 text-sm font-medium text-red-200 hover:bg-red-900 transition-colors"
              >
                Yeni Soru Sor / Baştan Başla
              </button>
            </div>
          )}

          {status === 'complete' && judgeResult && (
            <div className="rounded-xl border border-amber-900/50 bg-zinc-900/50 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl font-bold mb-6 text-amber-400 flex items-center gap-2">
                <span>🧑‍⚖️</span> Nihai Karar Özeti
              </h2>
              
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
                        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 rounded border border-zinc-600 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-sm font-medium text-zinc-100">{task.title}</h4>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800">{task.priority}</span>
                            </div>
                            <p className="text-xs text-zinc-400">{task.description}</p>
                          </div>
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
                  onClick={() => { setStatus('idle'); setDiscussion({}); setJudgeResult(null); setError(null); }}
                  disabled={saving}
                  className="rounded-md border border-zinc-700 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Reddet & Yeniden Başla
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
