'use client'

import { useState } from 'react'
import { runPortfolioManager } from '../portfolio-manager/actions'

export function RunPortfolioManagerButton() {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await runPortfolioManager()
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
      className="rounded-md border border-blue-700 bg-blue-900/30 px-4 py-2 text-sm font-bold text-blue-300 hover:bg-blue-800 transition-colors disabled:opacity-50"
    >
      {loading ? 'Board Analiz Ediyor...' : 'Executive Board Çalıştır'}
    </button>
  )
}
