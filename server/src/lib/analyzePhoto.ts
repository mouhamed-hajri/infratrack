import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export type PhotoAssessment = {
  category: string
  severity: string
  confidence: number
  summary: string
}

const toDataUrl = (b64: string) =>
  b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`

export async function analyzePhoto(imageBase64: string): Promise<PhotoAssessment> {
  const r = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: toDataUrl(imageBase64) } },
          {
            type: 'text',
            text: `You assess a photo of urban road/infrastructure damage in Tunisia for a municipal app. Reply ONLY JSON: {"category": one of ${JSON.stringify(CATEGORIES)}, "severity": one of ${JSON.stringify(SEVERITIES)}, "confidence": 0..1, "summary": one short sentence for a municipal worker}. Severity: LOW cosmetic; MEDIUM needs attention; HIGH safety risk; CRITICAL immediate danger.`,
          },
        ],
      },
    ],
  })

  const p = JSON.parse((r.choices[0]?.message?.content ?? '').trim()) as PhotoAssessment
  if (!CATEGORIES.includes(p.category)) p.category = 'OTHER'
  if (!SEVERITIES.includes(p.severity)) p.severity = 'MEDIUM'
  p.confidence = Math.max(0, Math.min(1, Number(p.confidence) || 0))
  p.summary = String(p.summary ?? '').slice(0, 300)
  return p
}
