import { createProject } from './actions'
import Link from 'next/link'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Proje</h1>
        <Link href="/projects" className="text-sm font-medium text-zinc-400 hover:text-zinc-100">
          İptal
        </Link>
      </div>

      <form action={createProject} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">Proje Adı *</label>
            <input id="title" name="title" required className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Açıklama</label>
            <textarea id="description" name="description" rows={3} className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
          </div>

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-zinc-300 mb-1">Hedef</label>
            <textarea id="goal" name="goal" rows={2} className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
          </div>

          <div>
            <label htmlFor="ceo_brief" className="block text-sm font-medium text-zinc-300 mb-1">
              CEO Brief (Şirket Hafızası)
              <span className="block text-xs text-zinc-500 mt-1 font-normal">Bu projeyle ilgili tüm metrikleri, denenmiş stratejileri, geçmiş başarıları veya başarısızlıkları buraya not edin. War Room bu bilgileri kullanarak karar verecektir.</span>
            </label>
            <textarea id="ceo_brief" name="ceo_brief" rows={6} className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 placeholder:text-zinc-600" placeholder="Örn: 1202 mekan kayıtlı, Instagram 500 takipçi, reklam denendi ama geri dönüş alınamadı..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1">Kategori</label>
              <select id="category" name="category" className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
                <option value="">Seçiniz</option>
                <option value="Mobil uygulama">Mobil uygulama</option>
                <option value="YouTube / İçerik">YouTube / İçerik</option>
                <option value="E-ticaret">E-ticaret</option>
                <option value="SaaS">SaaS</option>
                <option value="Danışmanlık">Danışmanlık</option>
                <option value="Kripto / Finans">Kripto / Finans</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-zinc-300 mb-1">Aşama</label>
              <select id="stage" name="stage" className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
                <option value="Fikir">Fikir</option>
                <option value="MVP">MVP</option>
                <option value="Test">Test</option>
                <option value="Yayında">Yayında</option>
                <option value="Gelir üretiyor">Gelir üretiyor</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
          Projeyi Kaydet
        </button>
      </form>
    </div>
  )
}
