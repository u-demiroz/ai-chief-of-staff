'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveMetrics, importJsonMetrics } from './actions'

export default function MetricsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [metrics, setMetrics] = useState({
    users_total: '',
    users_new_24h: '',
    users_new_7d: '',
    users_new_30d: '',
    app_downloads_total: '',
    app_downloads_7d: '',
    app_downloads_30d: '',
    active_users_24h: '',
    active_users_7d: '',
    active_users_30d: '',
    retention_rate: '',
    instagram_followers: '',
    instagram_followers_7d_growth: '',
    instagram_posts_30d: '',
    instagram_best_post_reach: '',
    youtube_subscribers: '',
    youtube_views_7d: '',
    revenue_total: '',
    revenue_30d: '',
    ad_spend_30d: '',
    conversions_30d: ''
  })

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Clean empty strings to undefined/null logic in action
      await saveMetrics(projectId, metrics)
      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jsonInput) return
    setLoading(true)
    setError(null)
    try {
      await importJsonMetrics(projectId, jsonInput)
      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetrics(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proje Metrikleri</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Gerçek kararlar gerçek verilere dayanır. Bu projenin bugünkü metriklerini girin veya admin panelinizden kopyaladığınız JSON'ı yapıştırın.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* JSON Import Section */}
      <section className="space-y-4 border border-zinc-800 p-6 rounded-xl bg-zinc-900/30">
        <h2 className="text-xl font-semibold">JSON Veri Yapıştır</h2>
        <p className="text-sm text-zinc-400">Özel admin panelinizden aldığınız metrikleri doğrudan yapıştırabilirsiniz. (Otomatik eşleşen alanlar kaydedilir, diğerleri custom_json içine atılır.)</p>
        <form onSubmit={handleJsonSubmit} className="space-y-4">
          <textarea
            rows={6}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 font-mono focus:border-zinc-500 focus:outline-none"
            placeholder="{\n  &quot;totalUsers&quot;: 1200,\n  &quot;revenue30d&quot;: 450\n}"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !jsonInput}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : 'JSON Aktar'}
          </button>
        </form>
      </section>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950 px-3 text-sm text-zinc-500 uppercase tracking-widest font-bold">Veya Manuel Girin</span>
        </div>
      </div>

      {/* Manual Form Section */}
      <form onSubmit={handleManualSubmit} className="space-y-8">
        
        {/* Kullanıcı Metrikleri */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">Kullanıcı & İndirme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Toplam Kullanıcı</label>
              <input type="number" name="users_total" value={metrics.users_total} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Son 7 Gün Yeni Kullanıcı</label>
              <input type="number" name="users_new_7d" value={metrics.users_new_7d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Son 30 Gün Yeni Kullanıcı</label>
              <input type="number" name="users_new_30d" value={metrics.users_new_30d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Toplam İndirme (App)</label>
              <input type="number" name="app_downloads_total" value={metrics.app_downloads_total} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Son 7 Gün İndirme</label>
              <input type="number" name="app_downloads_7d" value={metrics.app_downloads_7d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Aktif Kullanıcı (7d)</label>
              <input type="number" name="active_users_7d" value={metrics.active_users_7d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Sosyal Medya Metrikleri */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">Sosyal Medya</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Instagram Takipçi</label>
              <input type="number" name="instagram_followers" value={metrics.instagram_followers} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">IG Son 7 Gün Takipçi Artışı</label>
              <input type="number" name="instagram_followers_7d_growth" value={metrics.instagram_followers_7d_growth} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">YouTube Abone</label>
              <input type="number" name="youtube_subscribers" value={metrics.youtube_subscribers} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Finans Metrikleri */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">Finans & Reklam</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Toplam Gelir ($/₺)</label>
              <input type="number" name="revenue_total" step="0.01" value={metrics.revenue_total} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Son 30 Gün Gelir</label>
              <input type="number" name="revenue_30d" step="0.01" value={metrics.revenue_30d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Son 30 Gün Reklam Harcaması</label>
              <input type="number" name="ad_spend_30d" step="0.01" value={metrics.ad_spend_30d} onChange={handleChange} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Metrikleri Kaydet'}
          </button>
        </div>

      </form>
    </div>
  )
}
