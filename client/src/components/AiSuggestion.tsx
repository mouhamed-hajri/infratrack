import type { AiAssessment } from '../lib/api'
import { SeverityBadge } from './SeverityBadge'

const CATEGORY_LABELS: Record<string, string> = {
  POTHOLE: 'Pothole', ROAD_DAMAGE: 'Road damage', TRAFFIC_LIGHT: 'Traffic light',
  FLOODING: 'Flooding', SIGNAGE: 'Signage', OTHER: 'Other',
}

interface Props {
  status: 'analyzing' | 'done' | 'error'
  result?: AiAssessment
}

export function AiSuggestion({ status, result }: Props) {
  if (status === 'analyzing') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-brand-tint px-4 py-3 text-sm text-brand">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin shrink-0">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span>Analyzing photo with AI…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <p className="rounded-2xl px-4 py-3 text-xs text-clay" style={{ backgroundColor: '#C4622D12' }}>
        AI analysis unavailable — you can still fill in the details manually.
      </p>
    )
  }

  if (status === 'done' && result) {
    return (
      <div className="rounded-2xl bg-brand-tint px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">AI suggestion — applied below</p>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={result.severity} />
          <span className="text-xs text-muted">{CATEGORY_LABELS[result.category] ?? result.category}</span>
          <span className="text-xs text-muted">· {Math.round(result.confidence * 100)}% confidence</span>
        </div>
        {result.summary && <p className="text-xs text-ink leading-relaxed">{result.summary}</p>}
      </div>
    )
  }

  return null
}
