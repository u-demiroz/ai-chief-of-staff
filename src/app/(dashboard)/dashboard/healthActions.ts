'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, differenceInDays } from 'date-fns'

export async function calculateAllProjectHealths() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch all projects
  const { data: projects } = await supabase.from('projects').select('*')
  if (!projects) return

  for (const project of projects) {
    let score = 100
    let reasons: string[] = []

    // 1. Check open tasks
    const { data: openTasks } = await supabase
      .from('tasks')
      .select('created_at')
      .eq('project_id', project.id)
      .neq('status', 'done')
      .neq('status', 'cancelled')
      .neq('status', 'skipped')

    const pendingCount = openTasks?.length || 0
    if (pendingCount > 10) {
      score -= 10
      reasons.push(`Çok fazla açık görev var (${pendingCount})`)
    } else if (pendingCount > 5) {
      score -= 5
    }

    // Check if there are very old open tasks
    let hasStaleTasks = false
    const now = new Date()
    openTasks?.forEach(t => {
      if (differenceInDays(now, new Date(t.created_at)) > 21) {
        hasStaleTasks = true
      }
    })
    if (hasStaleTasks) {
      score -= 20
      reasons.push('21 günden eski açık görevler var')
    }

    // 2. Check recently completed tasks
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('completed_at, updated_at')
      .eq('project_id', project.id)
      .eq('status', 'done')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (!completedTasks || completedTasks.length === 0) {
      score -= 15
      reasons.push('Henüz hiç tamamlanmış görev yok')
    } else {
      const lastCompleted = new Date(completedTasks[0].updated_at)
      const daysSinceLastTask = differenceInDays(now, lastCompleted)
      if (daysSinceLastTask > 14) {
        score -= 20
        reasons.push(`${daysSinceLastTask} gündür ilerleme yok`)
      }
    }

    // 3. Check unimplemented decisions
    const { data: openDecisions } = await supabase
      .from('decisions')
      .select('created_at')
      .eq('project_id', project.id)
      .neq('status', 'implemented')
      .neq('status', 'ignored')

    let unimplementedCount = 0
    openDecisions?.forEach(d => {
      if (differenceInDays(now, new Date(d.created_at)) > 7) {
        unimplementedCount++
      }
    })

    if (unimplementedCount > 0) {
      score -= (unimplementedCount * 5)
      reasons.push(`${unimplementedCount} karar hala uygulanmadı`)
    }

    // Clamp score
    if (score < 0) score = 0
    if (score > 100) score = 100

    const finalReason = reasons.length > 0 ? reasons.join(', ') : 'Proje sağlıklı ilerliyor'

    // Update project
    await supabase.from('projects').update({
      health_score: score,
      health_reason: finalReason
    }).eq('id', project.id)
  }

  revalidatePath('/dashboard')
}
