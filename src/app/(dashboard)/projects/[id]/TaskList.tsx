'use client'

import { useState } from 'react'
import { updateTaskStatus, postponeTask, updateTaskNotes } from './actions'

type Task = {
  id: string
  title: string
  description?: string
  status: string
  due_date?: string
  notes?: string
  project_id: string
  projects?: { title: string }
}

export function TaskList({ tasks, projectId }: { tasks: Task[], projectId?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState<string | null>(null)

  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-zinc-500">Bu projeye ait görev bulunmuyor.</p>
  }

  const handleStatus = async (taskId: string, status: string, pId: string) => {
    setLoading(taskId)
    await updateTaskStatus(taskId, status, pId)
    setLoading(null)
  }

  const handlePostpone = async (taskId: string, days: number, pId: string) => {
    setLoading(taskId)
    await postponeTask(taskId, days, pId)
    setLoading(null)
  }

  const handleSaveNote = async (taskId: string, pId: string) => {
    setLoading(taskId)
    await updateTaskNotes(taskId, noteInput[taskId] || '', pId)
    setLoading(null)
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const isExpanded = expandedId === task.id
        const isDone = task.status === 'done'
        const activeProjectId = projectId || task.project_id
        
        return (
          <div key={task.id} className={`rounded-lg border ${isDone ? 'border-green-900/30 bg-green-950/10' : 'border-zinc-800 bg-zinc-950'} overflow-hidden transition-all`}>
            
            {/* Header / Condensed View */}
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-900/50"
              onClick={() => {
                setExpandedId(isExpanded ? null : task.id)
                if (!isExpanded && !noteInput[task.id]) {
                  setNoteInput(prev => ({ ...prev, [task.id]: task.notes || '' }))
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 -ml-2 cursor-pointer flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatus(task.id, isDone ? 'todo' : 'done', activeProjectId)
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
                  <h3 className={`text-sm font-medium ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      task.status === 'todo' ? 'bg-zinc-800 text-zinc-400' :
                      task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-400' :
                      task.status === 'done' ? 'bg-green-900/50 text-green-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {!projectId && task.projects?.title && (
                      <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800/50">
                        {task.projects.title}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-[10px] text-zinc-500">📅 {new Date(task.due_date).toLocaleDateString('tr-TR')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-zinc-500 text-xs">
                {isExpanded ? '▲' : '▼'}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 space-y-4">
                
                {task.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 mb-1">Açıklama</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 mb-1">Gelişmeler / Notlar</h4>
                  <textarea 
                    rows={3}
                    value={noteInput[task.id] ?? (task.notes || '')}
                    onChange={(e) => setNoteInput(prev => ({ ...prev, [task.id]: e.target.value }))}
                    placeholder="Bu görevle ilgili notlarınızı buraya girebilirsiniz..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleSaveNote(task.id, activeProjectId)}
                      disabled={loading === task.id || noteInput[task.id] === task.notes}
                      className="rounded bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {loading === task.id ? 'Kaydediliyor...' : 'Notu Kaydet'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800/50">
                  <span className="text-xs text-zinc-500 mr-2">Hızlı İşlemler:</span>
                  
                  {task.status !== 'in_progress' && (
                    <button onClick={() => handleStatus(task.id, 'in_progress', activeProjectId)} disabled={loading === task.id} className="rounded border border-blue-900/50 bg-blue-950/30 px-2 py-1 text-xs text-blue-400 hover:bg-blue-900/50">
                      ▶ Devam Ediyor Yap
                    </button>
                  )}
                  {task.status !== 'skipped' && (
                    <button onClick={() => handleStatus(task.id, 'skipped', activeProjectId)} disabled={loading === task.id} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700">
                      ⏭ İptal Et / Atla
                    </button>
                  )}
                  <button onClick={() => handlePostpone(task.id, 1, activeProjectId)} disabled={loading === task.id} className="rounded border border-amber-900/50 bg-amber-950/30 px-2 py-1 text-xs text-amber-400 hover:bg-amber-900/50">
                    ⏱ 1 Gün Ertele
                  </button>
                  <button onClick={() => handlePostpone(task.id, 7, activeProjectId)} disabled={loading === task.id} className="rounded border border-amber-900/50 bg-amber-950/30 px-2 py-1 text-xs text-amber-400 hover:bg-amber-900/50">
                    ⏱ 1 Hafta Ertele
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )
      })}
    </div>
  )
}
