'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const goal = formData.get('goal') as string
  const category = formData.get('category') as string
  const stage = formData.get('stage') as string
  const current_status = formData.get('current_status') as string

  const { error } = await supabase
    .from('projects')
    .update({
      title,
      description,
      goal,
      category,
      stage,
      current_status,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  // Due to ON DELETE CASCADE (or similar foreign keys), deleting a project might delete tasks.
  // Alternatively, the user's Supabase schema will handle cascading deletes.
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/projects')
  redirect('/dashboard')
}
