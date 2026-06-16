import { type Issue } from '../lib/api'

// CSS-glass cards (fast + cross-browser) — the issue list can grow long, so these
// stay lightweight while matching the liquid-glass visual language.
const severityStyle: Record<string, string> = {
  LOW: 'bg-emerald-400/10 text-emerald-300',
  MEDIUM: 'bg-amber-400/10 text-amber-300',
  HIGH: 'bg-orange-400/10 text-orange-300',
  CRITICAL: 'bg-rose-400/10 text-rose-300',
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return <p className="text-sm font-light text-slate-400">No issues yet — report one above.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {issues.map((i) => (
        <div key={i.id} className="glass p-5 transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-white">{i.title}</h3>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${severityStyle[i.severity] ?? 'bg-white/10 text-white'}`}>
              {i.severity}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-light text-slate-300">{i.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span>{i.category}</span>
            <span>·</span>
            <span>{i.status}</span>
            <span>·</span>
            <span className="text-[#a78bfa]">
              📍 {i.governorate?.name ?? 'Unassigned'}
              {i.municipality ? ` / ${i.municipality.name}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
