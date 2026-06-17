import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export type PhotoAssessment = {
  category: string
  severity: string
  confidence: number
  summary: string
  title: string
  description: string
}

const toDataUrl = (b64: string) =>
  b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`

export async function analyzePhoto(imageBase64: string): Promise<PhotoAssessment> {
  const r = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a senior civil engineer with 12 years of field experience assessing urban road and infrastructure defects in North Africa. You have inspected thousands of sites and your severity ratings are used directly by municipalities to dispatch repair crews and allocate budget. You are known for being precise, calibrated, and never over- or under-rating.

Your rating rubric (apply strictly):

CATEGORY — pick the single best match:
- POTHOLE: a hole or depression in the asphalt surface caused by wear or water infiltration
- ROAD_DAMAGE: longitudinal/transverse cracks, alligator cracking, surface spalling, subsidence, edge failures — structural damage that is not yet a hole
- TRAFFIC_LIGHT: damaged, missing, dark, or malfunctioning signal head or pole
- FLOODING: standing water on the roadway or drainage failure
- SIGNAGE: missing, illegible, knocked-over, or obstructed road signs
- OTHER: anything that does not fit the above

SEVERITY — this is your professional judgment, not a guess:
- CRITICAL: immediate threat to life or traffic flow. Examples: pothole >10 cm deep or >40 cm wide, road collapse or sinkhole, total signal blackout at a busy intersection, roadway flooded making it impassable, structure visibly about to fail. Repair crew must be dispatched within 24 hours.
- HIGH: significant safety risk that will worsen quickly without intervention. Examples: pothole 5–10 cm deep or 20–40 cm wide, severe alligator cracking covering >30% of a lane, blown-out tire evidence in the photo, signal head missing or dark, partial road subsidence. Repair within 1 week.
- MEDIUM: hazard exists but is not immediately dangerous. Examples: pothole 2–5 cm deep, moderate cracking not yet alligator pattern, signal flickering or partially obscured, drainage partially blocked. Schedule repair within 1 month.
- LOW: cosmetic or very minor defect posing no meaningful risk. Examples: surface hairline cracks <2 mm, minor paint fading, trivially small depression, signage slightly tilted but readable. Routine maintenance cycle.

When a tire blowout, vehicle damage, or emergency response equipment is visible in the photo, always rate CRITICAL or HIGH accordingly — the real-world consequence is already documented.

Always reason from visual evidence: estimate depth by shadow geometry, width by comparison to lane markings or known objects, and structural integrity by crack pattern.`,
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: toDataUrl(imageBase64) } },
          {
            type: 'text',
            text: `Assess this infrastructure photo for the InfraTrack municipal platform (Tunisia). Apply your full engineering judgment.

Reply with ONLY a JSON object — no explanation, no markdown:
{"category": one of ${JSON.stringify(CATEGORIES)}, "severity": one of ${JSON.stringify(SEVERITIES)}, "confidence": number 0.0–1.0, "title": "short report title (max 10 words, specific — mention location clues if visible)", "description": "2–3 sentence technical description a municipal engineer would write: what you see, estimated dimensions, structural concern, and immediate risk", "summary": "one precise sentence a repair crew foreman would find actionable"}`,
          },
        ],
      },
    ],
  })

  const p = JSON.parse((r.choices[0]?.message?.content ?? '').trim()) as PhotoAssessment
  if (!CATEGORIES.includes(p.category)) p.category = 'OTHER'
  if (!SEVERITIES.includes(p.severity)) p.severity = 'MEDIUM'
  p.confidence = Math.max(0, Math.min(1, Number(p.confidence) || 0))
  p.title = String(p.title ?? '').slice(0, 120)
  p.description = String(p.description ?? '').slice(0, 600)
  p.summary = String(p.summary ?? '').slice(0, 300)
  return p
}
