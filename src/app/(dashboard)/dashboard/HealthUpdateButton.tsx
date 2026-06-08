'use client'

import { useState } from 'react'
import { calculateAllProjectHealths } from './healthActions'

export function HealthUpdateButton() {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await calculateAllProjectHealths()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleUpdate}
      disabled={loading}
      className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
    >
      {loading ? 'Sağlık Güncelleniyor...' : 'Proje Sağlıklarını Güncelle'}
    </button>
  )
}
