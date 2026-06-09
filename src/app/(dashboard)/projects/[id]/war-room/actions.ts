'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { format, addDays } from 'date-fns'

export async function saveWarRoomDecision(projectId: string, result: any, question: string, context: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Save the decision
  const { data: decision, error: decisionError } = await supabase.from('decisions').insert({
    user_id: user.id,
    project_id: projectId,
    question: question,
    context: context,
    visionary_response: result.visionary,
    skeptic_response: result.skeptic,
    operator_response: result.operator,
    judge_response: JSON.stringify(result.judge),
    final_decision: result.judge.finalDecision,
    scores_json: result.judge.scores,
    tasks_json: result.judge.tasks,
    calendar_plan_json: result.judge.calendarPlan,
    do_not_do_json: result.judge.doNotDo,
    status: 'accepted'
  }).select().single()

  if (decisionError || !decision) {
    throw new Error('Failed to save decision: ' + decisionError?.message)
  }

  // Save tasks and calendar events
  const tasks = result.judge.tasks || []
  const calendarPlan = result.judge.calendarPlan || []

  for (let i = 0; i < tasks.length; i++) {
    const taskDef = tasks[i]
    const { data: task } = await supabase.from('tasks').insert({
      user_id: user.id,
      project_id: projectId,
      title: taskDef.title,
      description: taskDef.description,
      priority: taskDef.priority || 'medium',
      reason: taskDef.reason,
      success_criteria: taskDef.success_criteria,
      expected_output: taskDef.expected_output,
      estimated_time: taskDef.estimated_time,
      source: 'war_room_decision',
      status: 'todo'
    }).select().single()

    if (task) {
      // Find calendar plan for this task
      const plan = calendarPlan.find((p: any) => p.taskTitle === taskDef.title)
      if (plan) {
        const eventDate = format(addDays(new Date(), plan.dateOffset || 0), 'yyyy-MM-dd')
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          project_id: projectId,
          task_id: task.id,
          decision_id: decision.id,
          title: plan.taskTitle,
          description: plan.reason,
          event_date: eventDate,
          start_time: plan.startTime || null,
          end_time: plan.endTime || null,
          source: 'war_room_plan'
        })
      }
    }
  }

  // Also save a project note about this decision
  await supabase.from('project_notes').insert({
    user_id: user.id,
    project_id: projectId,
    content: `War Room Kararı: ${result.judge.summaryForMemory}`
  })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}
