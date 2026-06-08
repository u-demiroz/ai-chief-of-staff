'use client'

import { useState } from 'react'
import { updateEventStatus, postponeEvent } from './eventActions'

type CalendarEvent = {
  id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  status: string
  projects?: { title: string }
}

export function EventList({ events }: { events: CalendarEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  if (!events || events.length === 0) {
    return <p className="text-sm text-zinc-500">Bu bölümde listelenecek kayıt bulunmuyor.</p>
  }

  const handleStatus = async (eventId: string, status: string) => {
    setLoading(eventId)
    await updateEventStatus(eventId, status)
    setLoading(null)
  }

  const handlePostpone = async (eventId: string, days: number) => {
    setLoading(eventId)
    await postponeEvent(eventId, days)
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {events.map(event => {
        const isExpanded = expandedId === event.id
        const isDone = event.status === 'completed'
        
        return (
          <div key={event.id} className={`rounded-lg border ${isDone ? 'border-green-900/30 bg-green-950/10' : 'border-zinc-800 bg-zinc-950'} overflow-hidden transition-all`}>
            
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-900/50"
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 -ml-2 cursor-pointer flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatus(event.id, isDone ? 'scheduled' : 'completed')
                  }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isDone 
                      ? 'bg-green-500 text-black font-bold text-sm' 
                      : 'border-2 border-zinc-600 hover:border-green-500 hover:bg-green-500/20'
                  }`}>
                    {isDone ? '✓' : ''}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {event.start_time && (
                      <span className="text-[10px] font-medium text-zinc-400">{event.start_time.slice(0,5)} {event.end_time ? `- ${event.end_time.slice(0,5)}` : ''}</span>
                    )}
                  </div>
                  <h3 className={`text-sm font-medium ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {event.projects?.title && (
                      <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800/50">
                        {event.projects.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-zinc-500 text-xs">
                {isExpanded ? '▲' : '▼'}
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 space-y-4">
                {event.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 mb-1">Açıklama</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800/50">
                  {!isDone && (
                    <button onClick={() => handleStatus(event.id, 'completed')} disabled={loading === event.id} className="w-full rounded bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50">
                      ✓ Tamamlandı İşaretle
                    </button>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => handlePostpone(event.id, 1)} disabled={loading === event.id} className="flex-1 rounded border border-amber-900/50 bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-900/50 disabled:opacity-50">
                      ⏱ Yarına Ertele
                    </button>
                    {event.status !== 'skipped' && event.status !== 'cancelled' && (
                      <button 
                        onClick={() => {
                          if(window.confirm('DİKKAT: Bu görev tamamen silinecek ve bir daha karşınıza çıkmayacak. Emin misiniz?')) {
                            handleStatus(event.id, 'cancelled')
                          }
                        }} 
                        disabled={loading === event.id} 
                        className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-red-400 disabled:opacity-50"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )
      })}
    </div>
  )
}
