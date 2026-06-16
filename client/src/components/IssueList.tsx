import { type Issue } from '../lib/api'

const severityColor: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return <p className="text-sm text-gray-500">No issues yet — report one above.</p>
  }
  return (
    <ul className="space-y-3">
      {issues.map((i) => (
        <li key={i.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{i.title}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityColor[i.severity] ?? 'bg-gray-100 text-gray-700'}`}>
              {i.severity}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{i.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span>{i.category}</span>
            <span>·</span>
            <span>{i.status}</span>
            <span>·</span>
            <span>📍 {i.governorate?.name ?? 'Unassigned'}{i.municipality ? ` / ${i.municipality.name}` : ''}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
