import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all active projects, now including board_decision and priority_score
    const { data: projects } = await supabase.from('projects').select('id, title, stage, board_decision, portfolio_priority_score').neq('stage', 'Öldürüldü')
    const { data: tasks } = await supabase.from('tasks').select('id, title, status, projects(title, id, board_decision)').neq('status', 'done')
    const { data: pastDecisions } = await supabase.from('decisions').select('id, final_decision, projects(title, id)').neq('status', 'implemented').order('created_at', { ascending: false }).limit(5)
    
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { data: lateEvents } = await supabase.from('calendar_events').select('id, title, event_date, projects(title, id)').lt('event_date', todayStr).neq('status', 'completed').neq('status', 'cancelled')

    const systemContext = `
TÜM AKTİF PROJELER (EXECUTIVE BOARD KARARLARI):
${projects?.map(p => `- ID: ${p.id} | ${p.title} - Yönetim Kurulu Kararı: ${p.board_decision} | Öncelik Skoru: ${p.portfolio_priority_score}`).join('\n') || 'Yok'}

AÇIK GÖREVLER:
${tasks?.map(t => `- ID: ${t.id} | Proje: [${(t.projects as any)?.title}] (${(t.projects as any)?.board_decision}) ${t.title} (${t.status})`).join('\n') || 'Yok'}

GECİKEN İŞLER:
${lateEvents?.map(e => `- ID: ${e.id} | Proje: [${(e.projects as any)?.title}] ${e.title} (Planlanan: ${e.event_date})`).join('\n') || 'Yok'}

UYGULANMAYAN SON KARARLAR:
${pastDecisions?.map(d => `- ID: ${d.id} | Proje: [${(d.projects as any)?.title}] ${d.final_decision}`).join('\n') || 'Yok'}
`

    const prompt = `
Sen "AI Chief of Staff" sisteminin Genel Operasyon Yöneticisisin (Daily COO).
Kullanıcının projelerine bakarak günlük bir "Executive Summary" çıkarman ve günün/haftanın planını yapman gerekiyor.

BAĞLAM:
${systemContext}

GÖREVİN:
1. "Yönetim Kurulu Kararı (board_decision)" verilerine bak. SADECE "Focus" ve "Minimum Interest" olan projelere görev ata. "Freeze" olanlara KESİNLİKLE DOKUNMA.
2. Geciken işler veya uygulanmayan kararlar varsa kullanıcıyı SERTÇE uyar/eleştir.
3. Bugün tamamlanması gereken (gecikenler dahil) en fazla 3-5 görev çıkar/seç. Eğer mevcut açık/geciken görev varsa ONLARI kullan. Yoksa yeni görev yaz.
4. GÖREV YAZMA KURALLARI (YASAKLAR):
   - "Araştır, incele, değerlendir, pazar analizi yap, hedef kitle bul" gibi UCU AÇIK ve JENERİK görevler KESİNLİKLE YASAKTIR.
   - Her görev SPESİFİK, UYGULANABİLİR, İSİM/PLATFORM BELİRTİLMİŞ ve SONUÇ ODAKLI olmak zorundadır. (Örn: Yanlış: "Influencer araştır". Doğru: "Instagram'da nargile konseptli 3 micro-influencer'a DM at ve fiyat iste.")
5. "Bugün kesinlikle yapılmaması gerekenler" listesi oluştur (doNotDoToday). Dondurulmuş projeler burada yer almalı.
6. Bugünün görevlerini takvime yay (calendarPlan). Bugünün tarihi: ${todayStr}

YANIT FORMATI (SADECE JSON OLACAK, MARKDOWN YOK):
{
  "executiveSummary": "Genel özet...",
  "focusProjects": [
    { "projectId": "uuid", "title": "...", "reason": "..." }
  ],
  "todayTasks": [
    { "projectId": "uuid", "title": "...", "description": "...", "priority": "critical|high|medium" }
  ],
  "doNotDoToday": [
    "..."
  ],
  "criticism": "Eleştiri veya sert uyarı...",
  "calendarPlan": [
    { "projectId": "uuid", "taskTitle": "...", "date": "${todayStr}", "startTime": "10:00", "endTime": "11:00", "reason": "..." }
  ]
}
Dikkat: projectId alanlarına yukarıdaki bağlamdan aldığın GERÇEK UUID'leri yazmalısın. Eğer yeni bir proje değilse, mutlaka doğru UUID eşleşmeli.
`

    const model = 'openai/gpt-4o-mini'
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
          { role: 'system', content: 'Sen JSON formatında yanıt veren sert bir COO\'sun. Asla markdown (```json vb) kullanma.' },
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!res.ok) {
      console.error(`Failed to call OpenRouter:`, await res.text())
      return NextResponse.json({ error: 'AI yanıt veremedi.' }, { status: 500 })
    }

    const data = await res.json()
    let rawRes = data.choices[0].message.content

    if (rawRes.startsWith('```json')) {
      rawRes = rawRes.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    }

    let parsed
    try {
      parsed = JSON.parse(rawRes)
    } catch (e) {
      console.error("Failed to parse COO JSON:", rawRes)
      return NextResponse.json({ error: 'AI geçerli bir JSON üretemedi.' }, { status: 500 })
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
