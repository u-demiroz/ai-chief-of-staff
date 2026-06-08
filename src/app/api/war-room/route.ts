import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, question, context, action, visionaryRes, skepticRes, operatorRes } = body

    // 1. Fetch Project Memory
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
    const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', projectId).neq('status', 'done')
    const { data: pastDecisions } = await supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(3)
    const { data: notes } = await supabase.from('project_notes').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5)

    const systemContext = `
PROJE BAĞLAMI:
Adı: ${project.title}
Hedef: ${project.goal}
Mevcut Durum: ${project.current_status}
Aşama: ${project.stage}
Kategori: ${project.category}

Açık Görevler:
${tasks?.map(t => `- ${t.title} (${t.status})`).join('\n') || 'Yok'}

Geçmiş Kararlar:
${pastDecisions?.map(d => `- Soru: ${d.question}\n  Karar: ${d.final_decision}`).join('\n') || 'Yok'}

Notlar:
${notes?.map(n => `- ${n.content}`).join('\n') || 'Yok'}
`

    const callOpenRouter = async (modelName: string, systemPrompt: string, userPrompt: string) => {
      const model = modelName
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aichiefofstaff.local',
          'X-Title': 'AI Chief of Staff',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      })
      if (!res.ok) {
        const text = await res.text()
        console.error(`Failed to call OpenRouter for ${model}:`, text)
        throw new Error(`Model ${model} API Error: ${res.status} ${text}`)
      }
      const data = await res.json()
      if (!data.choices || data.choices.length === 0) {
        throw new Error(`Model ${model} boş yanıt döndürdü. API Key limitinizi kontrol edin.`)
      }
      return data.choices[0].message.content
    }

    const userQuery = `Kullanıcı Sorusu: ${question}\nEk Bağlam: ${context || 'Yok'}`

    if (action === 'discuss') {
      // 2. Call Roles in parallel
      const [vRes, sRes, oRes] = await Promise.all([
        callOpenRouter(
          'google/gemini-2.5-flash',
          `Sen Vizyoner bir stratejistsin.\nGörev: Fırsatları bul, cesur ama mantıklı öneriler getir. Pazarlama, büyüme ve gelir potansiyeline odaklan. Sıradan cevap verme.\n${systemContext}`,
          userQuery
        ),
        callOpenRouter(
          'anthropic/claude-3.5-sonnet',
          `Sen Şüpheci ve sert bir eleştirmensin.\nGörev: Fikri öldürmeye çalış, riskleri bul. Kullanıcının kendini kandırdığı noktaları söyle. "Bu iş neden batabilir?" sorusuna cevap ver. Gerektiğinde çok sert ol.\n${systemContext}`,
          userQuery
        ),
        callOpenRouter(
          'openai/gpt-4o',
          `Sen pragmatik bir Operasyoncusun.\nGörev: Gerçekçi uygulama planı çıkar. Bugün/bu hafta yapılabilecek adımlara indir. Gereksiz romantizm yapma.\n${systemContext}`,
          userQuery
        )
      ])

      return NextResponse.json({
        visionary: vRes,
        skeptic: sRes,
        operator: oRes
      })
    }

    if (action === 'judge') {
      // 3. Call Judge
      const judgePrompt = `
Sen "AI Chief of Staff" sisteminin Baş Hakemi ve nihai karar vericisisin.
Aşağıda bir proje hakkında Vizyoner, Şüpheci ve Operasyoncu'nun görüşlerini bulacaksın.

${systemContext}
${userQuery}

VİZYONER:
${visionaryRes}

ŞÜPHECİ:
${skepticRes}

OPERASYONCU:
${operatorRes}

GÖREVİN:
1. Önceki görüşleri değerlendir, önceki açık görevleri ve kararları kontrol et. Eğer kullanıcı geçmişte alınan kararları uygulamadan yeni şeyler istiyorsa, SADECE bunu yüzüne vur ve REDDET (doNotDo kısmına açıkla, finalDecision olarak da yeni iş uydurma, eski işleri yap de).
2. Eğer geçerli bir istekse, NET BİR KARAR VER.
3. 3-7 uygulanabilir görev çıkar (tasks array). Eğer eski işler bitmediyse görev çıkarma, boş array gönder.
4. Bu görevleri günlere yay (calendarPlan array - dateOffset 0 = bugün, 1 = yarın vb.).
5. "Kesinlikle yapılmaması gerekenler" listesi çıkar (doNotDo).
6. Kararı özetle (summaryForMemory).

YANIT FORMATI (SADECE VE SADECE GEÇERLİ JSON OLACAK):
{
  "finalDecision": "Net kararın açıklaması...",
  "reasoning": "Neden bu kararı aldın...",
  "scores": {
    "revenuePotential": 0,
    "feasibility": 0,
    "risk": 0,
    "priority": 0,
    "timing": 0
  },
  "tasks": [
    { "title": "...", "description": "...", "priority": "high" }
  ],
  "calendarPlan": [
    { "taskTitle": "...", "dateOffset": 0, "startTime": "10:00", "endTime": "11:00", "reason": "..." }
  ],
  "doNotDo": ["..."],
  "summaryForMemory": "..."
}
`

      let judgeRes = await callOpenRouter(
        'google/gemini-1.5-pro',
        'Sen JSON formatında yanıt veren bir hakemsin. Asla markdown (```json vb) kullanma.',
        judgePrompt
      )

      if (judgeRes.startsWith('```json')) {
        judgeRes = judgeRes.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      }

      let parsedJudge
      try {
        parsedJudge = JSON.parse(judgeRes)
      } catch (e) {
        console.error("Failed to parse Judge JSON:", judgeRes)
        throw new Error('AI geçerli bir JSON üretemedi. Çıktı: ' + judgeRes)
      }

      return NextResponse.json({
        judge: parsedJudge
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error("War Room Error:", error)
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 })
  }
}
