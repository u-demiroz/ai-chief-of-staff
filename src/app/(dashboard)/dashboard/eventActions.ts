'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEventStatus(eventId: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('calendar_events').update({ status }).eq('id', eventId)
  if (error) throw new Error(error.message)
  
  revalidatePath(`/dashboard`)
}

export async function postponeEvent(eventId: string, days: number) {
  const supabase = await createClient()
  
  const { data: event } = await supabase.from('calendar_events').select('event_date').eq('id', eventId).single()
  
  let newDate = new Date()
  if (event?.event_date) {
    newDate = new Date(event.event_date)
  }
  
  newDate.setDate(newDate.getDate() + days)
  
  const { error } = await supabase.from('calendar_events').update({ 
    event_date: newDate.toISOString().split('T')[0],
    status: 'rescheduled'
  }).eq('id', eventId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/dashboard`)
}
