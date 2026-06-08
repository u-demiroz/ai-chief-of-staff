'use client'

import { useState } from 'react'
import { saveDecisionOutcome, ignoreDecision } from './lessonsActions'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function LessonsLearnedList({ decisions }: { decisions: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [outcomeInputs, setOutcomeInputs] = useState<{ [key: string]: string }>({})
  const [activeDecision, setActiveDecision] = useState<string | null>(null)

  if (!decisions || decisions.length === 0) return null

  const handleSave = async (id: string) => {
    if (!outcomeInputs[id]) {
      alert("Lütfen kararın sonucunu yazın.")
      return
    }
    setLoading(id)
    await saveDecisionOutcome(id, outcomeInputs[id])
    setLoading(null)
  }

  const handleIgnore = async (id: string) => {
    if (window.confirm('Bu kararın takibini iptal etmek istediğinize emin misiniz?')) {
      setLoading(id)
      await ignoreDecision(id)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-950/30 border border-blue-900/50 p-4 mb-4">
        <p className="text-sm text-blue-300">
          <strong>Sistem Hafızası İnşa Ediliyor:</strong> Aşağıdaki kararlar War Room'da alındı. Bu kararların sonucunu sisteme bildirerek yapay zekanın şirketiniz için hangi stratejilerin çalışıp çalışmadığını öğrenmesini sağlayın.
        </p>
      </div>

      <div className="space-y-4">
        {decisions.map(d => (
          <div key={d.id} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold text-zinc-100">{d.projects?.title}</h3>
              <span className="text-xs text-zinc-500">{format(new Date(d.created_at), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
            <p className="text-sm text-zinc-300 italic mb-4">"{d.final_decision}"</p>
            
            {activeDecision === d.id ? (
              <div className="space-y-3 mt-4 pt-4 border-t border-zinc-800">
                <label className="block text-xs font-medium text-zinc-400">Bu kararın sonucu ne oldu? İşe yaradı mı?</label>
                <textarea 
                  rows={2}
                  value={outcomeInputs[d.id] || ''}
                  onChange={e => setOutcomeInputs(prev => ({...prev, [d.id]: e.target.value}))}
                  placeholder="Örn: Kullanıcılar %10 arttı, işe yaradı. / Beklenen etkiyi vermedi, iptal ettik."
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setActiveDecision(null)}
                    disabled={loading === d.id}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={() => handleSave(d.id)}
                    disabled={loading === d.id}
                    className="rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {loading === d.id ? 'Kaydediliyor...' : 'Hafızaya Kaydet'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                <span className="text-xs text-zinc-400">Uygulandı mı?</span>
                <button 
                  onClick={() => setActiveDecision(d.id)}
                  disabled={loading === d.id}
                  className="flex-1 rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Evet, Sonucu Bildir
                </button>
                <button 
                  onClick={() => handleIgnore(d.id)}
                  disabled={loading === d.id}
                  className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                >
                  Uygulanmadı / İptal
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
