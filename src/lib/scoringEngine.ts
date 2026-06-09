export type ProjectMetrics = {
  users_total?: number | null
  users_new_24h?: number | null
  users_new_7d?: number | null
  users_new_30d?: number | null
  active_users_24h?: number | null
  active_users_7d?: number | null
  active_users_30d?: number | null
  app_downloads_total?: number | null
  app_downloads_7d?: number | null
  app_downloads_30d?: number | null
  instagram_followers?: number | null
  instagram_followers_7d_growth?: number | null
  instagram_posts_30d?: number | null
  instagram_best_post_reach?: number | null
  youtube_subscribers?: number | null
  youtube_views_7d?: number | null
  revenue_total?: number | null
  revenue_30d?: number | null
  ad_spend_30d?: number | null
  conversions_30d?: number | null
  retention_rate?: number | null
}

export type ScoringResult = {
  momentumScore: number
  growthScore: number
  revenueScore: number
  dataCompletenessScore: number
  confidenceScore: number
  portfolioPriorityScore: number
  keySignals: string[]
  missingData: string[]
}

export function calculateProjectScores(metrics: ProjectMetrics | null): ScoringResult {
  if (!metrics) {
    return {
      momentumScore: 0,
      growthScore: 0,
      revenueScore: 0,
      dataCompletenessScore: 0,
      confidenceScore: 0,
      portfolioPriorityScore: 0,
      keySignals: ["Metrik tablosunda hiç veri yok."],
      missingData: ["Tüm metrikler eksik."]
    }
  }

  const keySignals: string[] = []
  const missingData: string[] = []

  let momentum = 0
  let growth = 0
  let revenue = 0
  
  // 1. Data Completeness Check
  const expectedKeys: (keyof ProjectMetrics)[] = [
    'users_new_7d', 'active_users_7d', 'app_downloads_7d', 
    'instagram_followers_7d_growth', 'revenue_30d'
  ]
  
  let filledExpected = 0
  expectedKeys.forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      filledExpected++
    } else {
      missingData.push(key.replace(/_/g, ' '))
    }
  })

  const dataCompletenessScore = Math.round((filledExpected / expectedKeys.length) * 100)
  
  // 2. Momentum Calculation (Short term velocity: 7d vs 30d ratios, absolute numbers)
  if (metrics.users_new_7d && metrics.users_new_7d > 0) {
    momentum += Math.min(40, metrics.users_new_7d * 2) // Cap at 40
    keySignals.push(`Son 7 günde +${metrics.users_new_7d} kullanıcı`)
  }
  if (metrics.app_downloads_7d && metrics.app_downloads_7d > 0) {
    momentum += Math.min(30, metrics.app_downloads_7d * 1.5)
    keySignals.push(`Son 7 günde +${metrics.app_downloads_7d} indirme`)
  }
  if (metrics.instagram_followers_7d_growth && metrics.instagram_followers_7d_growth > 0) {
    momentum += Math.min(20, metrics.instagram_followers_7d_growth * 0.5)
    keySignals.push(`Son 7 günde IG takipçi artışı: +${metrics.instagram_followers_7d_growth}`)
  }
  if (metrics.active_users_24h && metrics.active_users_24h > 0) {
    momentum += Math.min(10, metrics.active_users_24h)
    keySignals.push(`Son 24 saat aktif kullanıcı: ${metrics.active_users_24h}`)
  }
  momentum = Math.min(100, Math.max(0, momentum))

  // 3. Growth Score Calculation (Totals and 30d trends)
  if (metrics.users_new_30d && metrics.users_new_30d > 0) {
    growth += Math.min(50, metrics.users_new_30d)
  }
  if (metrics.app_downloads_30d && metrics.app_downloads_30d > 0) {
    growth += Math.min(30, metrics.app_downloads_30d)
  }
  if (metrics.retention_rate && metrics.retention_rate > 0) {
    growth += Math.min(20, metrics.retention_rate)
    keySignals.push(`Retention oranı: %${metrics.retention_rate}`)
  }
  growth = Math.min(100, Math.max(0, growth))

  // 4. Revenue Score Calculation
  if (metrics.revenue_30d !== null && metrics.revenue_30d !== undefined) {
    if (metrics.revenue_30d > 0) {
      revenue = Math.min(100, (metrics.revenue_30d / 100) * 10) // e.g. $1000 = 100 score
      keySignals.push(`Son 30 gün gelir: ${metrics.revenue_30d}`)
    } else {
      keySignals.push(`Henüz gelir üretmiyor`)
    }
  }

  // 5. Confidence Score
  // Confidence drops if we have missing data for the things that we claim are good.
  let confidenceScore = dataCompletenessScore
  if (momentum > 80 && dataCompletenessScore < 50) {
     confidenceScore -= 20 // Penalty for high momentum but low data (suspicious)
  }
  confidenceScore = Math.max(10, confidenceScore)

  // 6. Portfolio Priority Score
  // Weighted average: 40% Momentum, 30% Growth, 20% Revenue, 10% Confidence
  const portfolioPriorityScore = Math.round(
    (momentum * 0.4) + 
    (growth * 0.3) + 
    (revenue * 0.2) + 
    (confidenceScore * 0.1)
  )

  if (keySignals.length === 0) {
    keySignals.push('Durağan metrikler')
  }

  return {
    momentumScore: Math.round(momentum),
    growthScore: Math.round(growth),
    revenueScore: Math.round(revenue),
    dataCompletenessScore: Math.round(dataCompletenessScore),
    confidenceScore: Math.round(confidenceScore),
    portfolioPriorityScore: Math.round(portfolioPriorityScore),
    keySignals,
    missingData
  }
}
