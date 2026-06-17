import { useState } from 'react'
import { generateBriefing, type BriefingResult } from '../lib/api'
import { Surface } from '../ui/Surface'

export function AiBriefing() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<BriefingResult | null>(null)

  async function generate() {
    setStatus('loading')
    try {
      const r = await generateBriefing()
      setResult(r)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Surface
      className="p-5 mb-8"
      style={{ background: 'linear-gradient(135deg, rgba(15,92,91,0.04) 0%, rgba(15,92,91,0.01) 100%)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-brand text-base">✦</span>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">AI situation briefing</p>
        </div>
        {status === 'idle' && (
          <button
            onClick={generate}
            className="shrink-0 rounded-xl bg-brand px-4 py-1.5 text-xs font-semibold text-paper transition hover:bg-brand-deep"
          >
            Generate
          </button>
        )}
        {status === 'done' && (
          <button
            onClick={generate}
            className="shrink-0 text-xs text-muted hover:text-ink transition"
          >
            Regenerate
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="mt-2 text-sm text-muted">
          Generate a real-time executive summary of your city's infrastructure situation with recommended actions.
        </p>
      )}

      {status === 'loading' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <svg className="animate-spin h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Analyzing city data…
        </div>
      )}

      {status === 'done' && result && (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-relaxed text-ink">{result.briefing}</p>
          {result.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {result.actions.map((action, i) => (
                <span
                  key={i}
                  className="rounded-xl bg-brand/8 px-3 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/15"
                >
                  {i + 1}. {action}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-clay">
          Could not generate briefing. <button onClick={generate} className="underline hover:text-ink">Try again</button>
        </p>
      )}
    </Surface>
  )
}
