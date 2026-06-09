'use server'

import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

const openai = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://aichiefofstaff.local',
    'X-Title': 'AI Chief of Staff',
  }
})

export async function generateWeeklyBoardReport() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch all projects and their health
  const { data: projects } = await supabase.from('projects').select('id, title, health_score, health_reason')
  
  // Fetch tasks completed this week
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(title)')
    .gte('updated_at', lastWeek.toISOString())

  const { data: decisions } = await supabase
    .from('decisions')
    .select('*, projects(title)')
    .gte('created_at', lastWeek.toISOString())

  const systemPrompt = `Sen şirketin Yönetim Kurulu (Board) ve Genel Operasyon Yöneticisisin (COO).
Bugün haftalık değerlendirme toplantısındayız.
Kullanıcının projelerinin sağlık durumunu (health_score), bu hafta bitirilen/geciken görevlerini ve yeni alınan kararları incele.

ÇIKTI OLARAK ŞU BİLGİLERİ VER:
1. "executiveSummary": Bu haftanın genel özeti.
2. "bestProject": En sağlıklı ve en iyi ilerleyen projenin adı ve nedeni.
3. "worstProject": En sağlıksız, acil müdahale gereken projenin adı ve nedeni.
4. "strategicDecision": Yönetim kurulunun bu haftaki kararı. (Örn: "VPN projesini 30 gün dondur", "Tüm odağı HookahMap'e ver" gibi radikal ve net kararlar)
5. "stats": { "completedTasks": number, "openTasks": number, "criticalIssues": number }

VERİLER:
Projeler: ${JSON.stringify(projects)}
Son 7 Gün Görevleri: ${JSON.stringify(tasks)}
Son 7 Gün Kararları: ${JSON.stringify(decisions)}
`

  const result = await generateObject({
    model: openai('openai/gpt-4o-mini'),
    schema: z.object({
      executiveSummary: z.string(),
      bestProject: z.object({
        name: z.string(),
        reason: z.string()
      }),
      worstProject: z.object({
        name: z.string(),
        reason: z.string()
      }),
      strategicDecision: z.string(),
      stats: z.object({
        completedTasks: z.number(),
        openTasks: z.number(),
        criticalIssues: z.number()
      })
    }),
    prompt: systemPrompt
  })

  return result.object
}
