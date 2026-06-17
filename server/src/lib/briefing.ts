import Groq from 'groq-sdk'
import type { Analytics } from './analytics'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export type BriefingResult = {
  briefing: string
  actions: string[]
}

function deterministicFallback(a: Analytics): BriefingResult {
  const { kpis, worstZones, byCategory } = a
  const topCat = byCategory[0]?.key?.replace(/_/g, ' ').toLowerCase() ?? 'infrastructure issues'
  const overdueNote = kpis.overdue > 0 ? ` ${kpis.overdue} issues are past their SLA deadline.` : ''
  const zone = worstZones[0]?.name ? ` Highest-risk zone: ${worstZones[0].name}.` : ''
  return {
    briefing: `${a.scope} currently has ${kpis.open} open infrastructure reports out of ${kpis.total} total, with a ${Math.round(kpis.resolutionRate * 100)}% resolution rate.${overdueNote}${zone} The most common active issue type is ${topCat}.`,
    actions: [
      kpis.overdue > 0 ? `Address ${kpis.overdue} overdue issue(s) immediately to meet SLA targets` : `Maintain current response pace to sustain resolution rate`,
      kpis.criticalOpen > 0 ? `Prioritize ${kpis.criticalOpen} critical/high severity open issues` : `Continue monitoring for severity escalations`,
      `Review ${topCat} reports — highest active category`,
    ].slice(0, 3),
  }
}

export async function generateBriefing(a: Analytics): Promise<BriefingResult> {
  const prompt = {
    scope: a.scope,
    kpis: a.kpis,
    topCategories: a.byCategory.slice(0, 4),
    worstZones: a.worstZones.slice(0, 4),
    recentTrend: a.weekly.slice(-3),
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a chief operations advisor for a Tunisian municipal road-maintenance authority. Write crisp, factual executive briefings. Use ONLY the numbers provided — invent nothing. Respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Based on this city data, write an executive briefing.\n\nData:\n${JSON.stringify(prompt, null, 2)}\n\nRespond with this exact JSON shape:\n{"briefing":"3-4 sentence executive summary of current infrastructure status","actions":["action 1","action 2","action 3"]}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.3,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw) as { briefing?: string; actions?: unknown[] }

    const briefing = typeof parsed.briefing === 'string' && parsed.briefing.length > 10
      ? parsed.briefing
      : deterministicFallback(a).briefing

    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.filter((x): x is string => typeof x === 'string').slice(0, 3)
      : deterministicFallback(a).actions

    return { briefing, actions }
  } catch {
    return deterministicFallback(a)
  }
}
