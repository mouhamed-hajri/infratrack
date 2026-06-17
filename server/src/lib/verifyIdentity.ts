import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export type VerificationResult = {
  cinNumber: string | null
  faceMatch: boolean
  confidence: number
  reason: string
}

function toDataUrl(b64: string): string {
  // already a data URL
  if (b64.startsWith('data:')) return b64
  return `data:image/jpeg;base64,${b64}`
}

export async function verifyIdentity(selfieBase64: string, cinPhotoBase64: string): Promise<VerificationResult> {
  const response = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: toDataUrl(selfieBase64) } },
        { type: 'image_url', image_url: { url: toDataUrl(cinPhotoBase64) } },
        {
          type: 'text',
          text: 'Image 1 is a selfie. Image 2 is a Tunisian national ID card (CIN). Do two things: 1) OCR the 8-digit CIN number from the card. 2) Check whether the face in image 1 matches the face on the card in image 2. Reply with ONLY valid JSON: {"cinNumber":"12345678","faceMatch":true,"confidence":0.92,"reason":"brief explanation"}',
        },
      ],
    }],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  try {
    return JSON.parse(raw.trim()) as VerificationResult
  } catch {
    throw new Error(`AI response could not be parsed: ${raw.slice(0, 120)}`)
  }
}
