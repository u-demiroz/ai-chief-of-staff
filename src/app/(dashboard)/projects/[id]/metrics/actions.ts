'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveMetrics(projectId: string, metrics: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Clean empty strings to null
  const cleanedMetrics: any = {}
  for (const [key, value] of Object.entries(metrics)) {
    cleanedMetrics[key] = value === '' ? null : Number(value)
  }

  const { error } = await supabase.from('project_metrics').insert({
    user_id: user.id,
    project_id: projectId,
    ...cleanedMetrics
  })

  if (error) {
    throw new Error('Failed to save metrics: ' + error.message)
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function importJsonMetrics(projectId: string, jsonString: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString)
  } catch (e) {
    throw new Error('Geçersiz JSON formatı')
  }

  // Attempt to map common keys, anything else goes to custom_json
  const mappedMetrics: any = {
    custom_json: {}
  }

  const knownKeys: Record<string, string> = {
    totalUsers: 'users_total',
    newUsers24h: 'users_new_24h',
    newUsers7d: 'users_new_7d',
    newUsers30d: 'users_new_30d',
    activeUsers24h: 'active_users_24h',
    activeUsers7d: 'active_users_7d',
    activeUsers30d: 'active_users_30d',
    appDownloadsTotal: 'app_downloads_total',
    appDownloads7d: 'app_downloads_7d',
    appDownloads30d: 'app_downloads_30d',
    instagramFollowers: 'instagram_followers',
    instagramFollowers7dGrowth: 'instagram_followers_7d_growth',
    instagramPosts30d: 'instagram_posts_30d',
    instagramBestPostReach: 'instagram_best_post_reach',
    youtubeSubscribers: 'youtube_subscribers',
    youtubeViews7d: 'youtube_views_7d',
    revenueTotal: 'revenue_total',
    revenue30d: 'revenue_30d',
    adSpend30d: 'ad_spend_30d',
    conversions30d: 'conversions_30d',
    retentionRate: 'retention_rate'
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (knownKeys[key]) {
      mappedMetrics[knownKeys[key]] = value
    } else if (knownKeys[key.replace(/_/g, '')] !== undefined) {
      // rough matching if they pass snake_case
       // (simplification: if exact match exists in DB schema keys, we can just use it directly)
       const isExactDbKey = Object.values(knownKeys).includes(key)
       if (isExactDbKey) {
           mappedMetrics[key] = value
       } else {
          mappedMetrics.custom_json[key] = value
       }
    } else {
      mappedMetrics.custom_json[key] = value
    }
  }

  const { error } = await supabase.from('project_metrics').insert({
    user_id: user.id,
    project_id: projectId,
    ...mappedMetrics
  })

  if (error) {
    throw new Error('Failed to import JSON metrics: ' + error.message)
  }

  revalidatePath(`/projects/${projectId}`)
}
