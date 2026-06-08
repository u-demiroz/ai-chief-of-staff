'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveDecisionOutcome(decisionId: string, outcome: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('decisions').update({ 
    status: 'implemented',
    outcome: outcome,
    implemented_at: new Date().toISOString()
  }).eq('id', decisionId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/dashboard`)
}

export async function ignoreDecision(decisionId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('decisions').update({ 
    status: 'ignored'
  }).eq('id', decisionId)

  if (error) throw new Error(error.message)
  
  revalidatePath(`/dashboard`)
}
