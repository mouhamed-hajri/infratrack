import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type VerificationResult = {
  cinNumber: string | null
  faceMatch: boolean
  confidence: number
  reason: string
}

type SupportedMedia = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

function splitBase64(b64: string): { data: string; mediaType: SupportedMedia } {
  const match = b64.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/)
  if (match) return { mediaType: match[1] as SupportedMedia, data: match[2] }
  return { mediaType: 'image/jpeg', data: b64 }
}

export async function verifyIdentity(selfieBase64: string, cinPhotoBase64: string): Promise<VerificationResult> {
  const selfie = splitBase64(selfieBase64)
  const card = splitBase64(cinPhotoBase64)

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: selfie.mediaType, data: selfie.data } },
        { type: 'image', source: { type: 'base64', media_type: card.mediaType, data: card.data } },
        {
          type: 'text',
          text: 'Image 1 is a selfie. Image 2 is a Tunisian national ID card (CIN — Carte d\'Identité Nationale). Do two things: 1) OCR the 8-digit CIN number from the card. 2) Check whether the face in image 1 matches the face on the card in image 2. Reply with ONLY valid JSON, no other text: {"cinNumber":"12345678","faceMatch":true,"confidence":0.92,"reason":"faces match, same features"}',
        },
      ],
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  // strip markdown fences if model wraps in ```json
  const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  try {
    return JSON.parse(json) as VerificationResult
  } catch {
    throw new Error(`AI response could not be parsed: ${raw.slice(0, 120)}`)
  }
}
