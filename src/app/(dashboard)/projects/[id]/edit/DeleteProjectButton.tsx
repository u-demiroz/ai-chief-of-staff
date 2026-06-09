'use client'

export function DeleteProjectButton() {
  return (
    <button 
      type="submit" 
      className="w-full rounded-md border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-900/40 transition-colors"
      onClick={(e) => {
        if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
          e.preventDefault()
        }
      }}
    >
      Projeyi Tamamen Sil
    </button>
  )
}
