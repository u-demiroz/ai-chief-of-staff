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
    const { projectId, question, context, action, visionaryRes, skepticRes, operatorRes, isDeepResearch } = body

    // 1. Fetch Project Memory
    let systemContext = ""
    let project = null

    if (projectId && projectId !== 'global') {
      const { data: p } = await supabase.from('projects').select('*').eq('id', projectId).single()
      project = p
      const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', projectId).neq('status', 'done')
      const { data: pastDecisions } = await supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(3)
      const { data: notes } = await supabase.from('project_notes').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5)

      systemContext = `
PROJE BAĞLAMI:
Adı: ${project?.title || 'Belirtilmemiş'}
Aşama: ${project?.stage || 'Belirtilmemiş'}
Yönetim Kurulu Kararı (Board Decision): ${project?.board_decision || 'Belirtilmemiş'}

Açık Görevler:
${tasks?.map(t => `- ${t.title} (${t.status})`).join('\n') || 'Yok'}

Geçmiş Kararlar:
${pastDecisions?.map(d => `- Soru: ${d.question}\n  Karar: ${d.final_decision}`).join('\n') || 'Yok'}

Notlar:
${notes?.map(n => `- ${n.content}`).join('\n') || 'Yok'}
`
    }

    if (isDeepResearch) {
      // Fetch entire portfolio history for lessons learned and veto logic
      const { data: allProjects } = await supabase.from('projects').select('id, title, health_score, board_decision').neq('stage', 'Öldürüldü')
      const { data: implementedDecisions } = await supabase.from('decisions').select('question, final_decision, outcome, projects(title)').eq('status', 'implemented').order('implemented_at', { ascending: false }).limit(10)
      
      systemContext += `\n
[DEEP RESEARCH MODU AKTİF - PORTFÖY HAFIZASI]
AKTİF PROJELER (KAPASİTE DURUMU):
${allProjects?.map(p => `- ${p.title} (Sağlık: ${p.health_score}, Board: ${p.board_decision})`).join('\n')}

ÖĞRENİLEN DERSLER (Geçmişte uygulanan stratejiler ve sonuçları):
${implementedDecisions?.map(d => `- Proje: ${(d.projects as any)?.title}\n  Karar: ${d.final_decision}\n  Sonuç: ${d.outcome}`).join('\n\n') || 'Henüz şirket hafızasında ders çıkarılacak sonuçlanmış veri yok.'}
`
    }

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

    if (action === 'visionary') {
      const vRes = await callOpenRouter(
        'google/gemini-2.5-flash',
        `Sen Vizyoner bir stratejistsin.\nGörev: Fırsatları bul, cesur ama mantıklı öneriler getir. Pazarlama, büyüme ve gelir potansiyeline odaklan. Sıradan cevap verme.\n${systemContext}`,
        userQuery
      )
      return NextResponse.json({ visionary: vRes })
    }

    if (action === 'skeptic') {
      const sRes = await callOpenRouter(
        'meta-llama/llama-3.3-70b-instruct',
        `Sen Şüpheci ve acımasız bir eleştirmensin. Az önce Vizyoner aşağıdaki fikri sundu:\n\n--VİZYONERİN FİKRİ--\n${visionaryRes}\n---------------------\n\nGörev: Vizyoner'in fikrini okudun. Şimdi bu fikri çürüt, riskleri bul. Kullanıcının ve vizyonerin kendini kandırdığı noktaları yüzlerine vur. "Bu iş neden batabilir?" sorusuna cevap ver. Vizyoner'in yazdıklarına doğrudan atıfta bulunarak ("Vizyonerin dediği X hayal ürünü...") eleştir. Gerektiğinde çok sert ol.\n${systemContext}`,
        userQuery
      )
      return NextResponse.json({ skeptic: sRes })
    }

    if (action === 'operator') {
      const oRes = await callOpenRouter(
        'openai/gpt-4o',
        `Sen pragmatik bir Operasyoncusun. Az önce Vizyoner bir hayal kurdu, Şüpheci ise bu hayali eleştirdi:\n\n--VİZYONER--\n${visionaryRes}\n\n--ŞÜPHECİ--\n${skepticRes}\n---------------------\n\nGörev: Her ikisini de okudun. İkisini harmanla: "Vizyonerin şu fikri abartı ama Şüphecinin şu korkusunu şöyle aşarsak, bugün gerçekçi olarak şu adımları atabiliriz" de. Gerçekçi bir uygulama planı çıkar. Bugün/bu hafta yapılabilecek eylemlere indir. Gereksiz romantizm yapma.\n${systemContext}`,
        userQuery
      )
      return NextResponse.json({ operator: oRes })
    }

    if (action === 'judge') {
      const judgePrompt = `
Sen "AI Chief of Staff" sisteminin Baş Hakemi ve nihai karar vericisisin.
Aşağıda bir proje hakkında Vizyoner, Şüpheci ve Operasyoncu'nun sırayla gerçekleştirdiği tartışmayı bulacaksın.

${systemContext}
${userQuery}

VİZYONER:
${visionaryRes}

ŞÜPHECİ (Vizyoner'e cevap verdi):
${skepticRes}

OPERASYONCU (İkisini harmanladı):
${operatorRes}

GÖREVİN:
1. Önceki görüşleri değerlendir, önceki açık görevleri ve "DEEP RESEARCH MODU"ndaki 'Öğrenilen Dersler'i (Lessons Learned) DİKKATLE KONTROL ET.
2. EĞER kullanıcı daha önce denenmiş ve başarısız olmuş bir stratejiyi istiyorsa VETO ET (DoNotDo'ya ekle ve Reddet).
3. EĞER kullanıcı "Yeni Proje" açmak istiyorsa ve Portföydeki diğer projelerin sağlığı kötüyse KESİN BİR DİLLE VETO ET.
4. Çıkaracağın görevler (tasks array) UCU AÇIK OLAMAZ. "Araştır, incele, değerlendir" YASAKTIR. Sadece spesifik, isimli, sonuç odaklı eylemler çıkar.
5. Bu görevleri günlere yay (calendarPlan array).
6. "Kesinlikle yapılmaması gerekenler" listesi çıkar (doNotDo). Veto edilen konular burada olmalı.
7. Kararı özetle (summaryForMemory).

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
        'openai/gpt-4o',
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
