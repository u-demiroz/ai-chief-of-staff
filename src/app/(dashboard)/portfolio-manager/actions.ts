'use server'

import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { calculateProjectScores } from '@/lib/scoringEngine'

const openai = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://aichiefofstaff.local',
    'X-Title': 'AI Chief of Staff',
  }
})

export async function runPortfolioManager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch user's weekly capacity
  const { data: profile } = await supabase.from('profiles').select('weekly_capacity_hours').eq('id', user.id).single()
  const weeklyCapacity = profile?.weekly_capacity_hours || 20

  // 2. Fetch all projects
  const { data: projects } = await supabase.from('projects').select('*').neq('stage', 'Öldürüldü')
  if (!projects || projects.length === 0) return

  // 3. For each project, fetch latest metrics, calculate scores, and prepare for AI
  const projectDataForAi = []
  const computedScoresMap: Record<string, any> = {}

  for (const p of projects) {
    // Fetch latest metrics
    const { data: metricsArr } = await supabase
      .from('project_metrics')
      .select('*')
      .eq('project_id', p.id)
      .order('metric_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    
    const latestMetrics = metricsArr && metricsArr.length > 0 ? metricsArr[0] : null
    
    // Calculate deterministic scores
    const scores = calculateProjectScores(latestMetrics)
    computedScoresMap[p.id] = scores

    projectDataForAi.push({
      id: p.id,
      title: p.title,
      ceo_brief: p.ceo_brief,
      ...scores
    })
  }

  const systemPrompt = `Sen şirketin AI Yönetim Kurulusun (Executive Board).
Görevin görev yazmak değil, kullanıcının SINIRLI ZAMANINI (Dikkatini) doğru projelere dağıtmaktır.
Kullanıcının bu hafta projelere ayırabileceği toplam kapasite: ${weeklyCapacity} saattir.

DİKKAT: SKORLAR SİSTEM TARAFINDAN GERÇEK VERİLERE DAYANARAK HESAPLANMIŞTIR.
Sen skor üretmiyorsun. Senin görevin bu skorları ve sinyalleri "YORUMLAMAK" ve stratejik bir karar vermektir.

PORTFÖYÜNDEKİ PROJELER VE SİSTEMİN HESAPLADIĞI SKORLAR:
${JSON.stringify(projectDataForAi, null, 2)}

KURALLAR:
1. Her proje için bir 'board_decision' ver:
   - "Focus": Kapasitenin büyük çoğunluğunu alacak, Momentum ve Growth skoru yüksek veya Revenue üreten öncelikli proje.
   - "Minimum Interest": Sadece kritik işlerin yapılacağı proje (1-2 saat).
   - "Freeze": Bu hafta tamamen dondurulan, vakit harcanmayacak proje (0 saat). (Eğer veri eksiği çok fazlaysa veya skorlar sıfırsa freeze edebilirsin).
2. 'allocated_hours' alanına her proje için bu hafta harcanması gereken tahmini saati yaz. Tüm projelerin saat toplamı tam olarak ${weeklyCapacity} saat OLMALIDIR.
3. 'reasoning' ALANI: Sistem skorlarını baz alarak "NİYE" bu kararı verdiğini 2-3 madde halinde açıkla. (Örn: "Momentum skoru 80 çünkü son 7 günde ciddi kullanıcı artışı var. | Ancak gelir verisi eksik. | Organik büyüme olduğu için 10 saat ayrılmalı.")
4. 'recommended_action' ALANI: Bu proje için bu haftaki EN KRİTİK stratejik hamle ne olmalı? Genel geçer şeyler yazma. (Örn: "Influencer bul" DEME. "IG takipçi artışı iyi, DM otomasyonu kurarak dönüşümü test et" de).

ÇIKTI FORMATI (JSON):
Bir array döndür. Array içindeki her obje proje ID'sini ve senin yorumlarını içermelidir.
`

  const result = await generateObject({
    model: openai('openai/gpt-4o'),
    schema: z.object({
      evaluations: z.array(z.object({
        id: z.string(),
        board_decision: z.enum(['Focus', 'Minimum Interest', 'Freeze']),
        allocated_hours: z.number(),
        reasoning: z.string(),
        recommended_action: z.string()
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
    const scores = computedScoresMap[evalResult.id]

    // 4.1 Update projects table (sync scores so dashboard works)
    await supabase.from('projects').update({
      momentum: scores.momentumScore,
      health_score: scores.healthScore || scores.portfolioPriorityScore, // Default fallback
      portfolio_priority_score: scores.portfolioPriorityScore,
      board_decision: evalResult.board_decision,
      allocated_hours: evalResult.allocated_hours,
      health_reason: evalResult.reasoning
    }).eq('id', evalResult.id)

    // 4.2 Insert into project_snapshots
    await supabase.from('project_snapshots').insert({
      user_id: user.id,
      project_id: evalResult.id,
      summary: evalResult.reasoning,
      momentum_score: scores.momentumScore,
      growth_score: scores.growthScore,
      revenue_score: scores.revenueScore,
      data_completeness_score: scores.dataCompletenessScore,
      confidence_score: scores.confidenceScore,
      portfolio_priority_score: scores.portfolioPriorityScore,
      key_signals_json: scores.keySignals,
      missing_data_json: scores.missingData,
      recommendation: evalResult.recommended_action
    })
  }

  revalidatePath('/dashboard')
  return result.object
}
