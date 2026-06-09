'use server'

import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function runPortfolioManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch user's weekly capacity
  const { data: profile } = await supabase.from('profiles').select('weekly_capacity_hours').eq('id', user.id).single()
  const weeklyCapacity = profile?.weekly_capacity_hours || 20

  // 2. Fetch all projects
  const { data: projects } = await supabase.from('projects').select('*')
  if (!projects || projects.length === 0) return

  // 3. Fetch summary of tasks for each project
  const projectSummaries = await Promise.all(projects.map(async (p) => {
    const { count: openTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', p.id)
      .neq('status', 'done')
      .neq('status', 'cancelled')
    
    return {
      id: p.id,
      title: p.title,
      revenue_potential: p.revenue_potential,
      health_score: p.health_score,
      health_reason: p.health_reason,
      openTasks: openTasks || 0
    }
  }))

  const systemPrompt = `Sen şirketin AI Yönetim Kurulusun (Executive Board).
Görevin görev yazmak değil, kullanıcının SINIRLI ZAMANINI (Dikkatini) doğru projelere dağıtmaktır.
Kullanıcının bu hafta projelere ayırabileceği toplam kapasite: ${weeklyCapacity} saattir.

PORTFÖYÜNDEKİ PROJELER:
${JSON.stringify(projectSummaries, null, 2)}

KURALLAR:
1. Her proje için 0-100 arası şu skorları belirle: 'momentum', 'time_to_revenue', 'strategic_value', 'portfolio_priority_score' (Ağırlıklı ortalama).
2. Her proje için bir 'board_decision' ver:
   - "Focus": Kapasitenin büyük çoğunluğunu alacak, öncelikli proje.
   - "Minimum Interest": Sadece kritik işlerin yapılacağı proje (1-2 saat).
   - "Freeze": Bu hafta tamamen dondurulan, vakit harcanmayacak proje (0 saat).
3. 'allocated_hours' alanına her proje için bu hafta harcanması gereken tahmini saati yaz. Tüm projelerin saat toplamı tam olarak ${weeklyCapacity} saat OLMALIDIR.

ÇIKTI FORNATI (JSON):
Bir array döndür. Array içindeki her obje proje ID'sini ve yeni hesaplanan değerlerini içermelidir.
`

  const result = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      evaluations: z.array(z.object({
        id: z.string(),
        momentum: z.number(),
        time_to_revenue: z.number(),
        strategic_value: z.number(),
        portfolio_priority_score: z.number(),
        board_decision: z.enum(['Focus', 'Minimum Interest', 'Freeze']),
        allocated_hours: z.number(),
        reasoning: z.string() // Kullanıcıya bu kararın neden alındığını açıklayan 1 cümle
      })),
      newProjectVeto: z.object({
        isAllowed: z.boolean(),
        reason: z.string()
      })
    }),
    prompt: systemPrompt
  })

  // 4. Update the DB with the evaluations
  const evaluations = result.object.evaluations
  for (const evalResult of evaluations) {
    await supabase.from('projects').update({
      momentum: evalResult.momentum,
      time_to_revenue: evalResult.time_to_revenue,
      strategic_value: evalResult.strategic_value,
      portfolio_priority_score: evalResult.portfolio_priority_score,
      board_decision: evalResult.board_decision,
      allocated_hours: evalResult.allocated_hours,
      health_reason: evalResult.reasoning // update health reason with board reasoning
    }).eq('id', evalResult.id)
  }

  // Also return the Veto decision so the dashboard can display it
  revalidatePath('/dashboard')
  return result.object
}
