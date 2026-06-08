'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTaskStatus(taskId: string, status: string, projectId: string) {
  const supabase = await createClient()
  
  const updates: any = { status }
  
  if (status === 'done' || status === 'skipped') {
    updates.completed_at = new Date().toISOString()
  } else {
    updates.completed_at = null
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/projects/${projectId}`)
}

export async function postponeTask(taskId: string, days: number, projectId: string) {
  const supabase = await createClient()
  
  // First, get the current due date (or use today if null)
  const { data: task } = await supabase.from('tasks').select('due_date').eq('id', taskId).single()
  
  let newDate = new Date()
  if (task?.due_date) {
    newDate = new Date(task.due_date)
  }
  
  newDate.setDate(newDate.getDate() + days)
  
  const { error } = await supabase.from('tasks').update({ due_date: newDate.toISOString() }).eq('id', taskId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/projects/${projectId}`)
}

export async function updateTaskNotes(taskId: string, notes: string, projectId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('tasks').update({ notes }).eq('id', taskId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/projects/${projectId}`)
}
