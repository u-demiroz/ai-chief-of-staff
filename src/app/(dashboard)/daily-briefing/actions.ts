'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveDailyBriefing(result: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const tasks = result.todayTasks || []
  const calendarPlan = result.calendarPlan || []

  // Save tasks
  for (const taskDef of tasks) {
    if (!taskDef.projectId) continue;

    const { data: task } = await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: taskDef.projectId,
      title: taskDef.title,
      description: taskDef.description,
      priority: taskDef.priority || 'medium',
      source: 'daily_briefing',
      status: 'todo'
    }).select().single()

    if (task) {
      // Find calendar plan
      const plan = calendarPlan.find((p: any) => p.taskTitle === taskDef.title)
      if (plan) {
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          project_id: taskDef.projectId,
          task_id: task.id,
          title: plan.taskTitle,
          description: plan.reason,
          event_date: plan.date,
          start_time: plan.startTime || null,
          end_time: plan.endTime || null,
          source: 'ai_daily_plan'
        })
      }
    }
  }

  // Save calendar plans for existing tasks or standalone
  for (const plan of calendarPlan) {
    if (!tasks.find((t: any) => t.title === plan.taskTitle) && plan.projectId) {
      await supabase.from('calendar_events').insert({
        user_id: user.id,
        project_id: plan.projectId,
        title: plan.taskTitle,
        description: plan.reason,
        event_date: plan.date,
        start_time: plan.startTime || null,
        end_time: plan.endTime || null,
        source: 'ai_daily_plan'
      })
    }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
