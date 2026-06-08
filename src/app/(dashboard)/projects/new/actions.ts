'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    goal: formData.get('goal') as string,
    category: formData.get('category') as string,
    stage: formData.get('stage') as string,
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single()

  if (error || !project) {
    throw new Error('Failed to create project')
  }

  redirect(`/projects/${project.id}`)
}
