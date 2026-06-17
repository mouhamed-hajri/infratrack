export const SEVERITY_COLOR: Record<string, string> = {
  LOW: '#3F7D5B',
  MEDIUM: '#B8861E',
  HIGH: '#C4622D',
  CRITICAL: '#A8321F',
}

export function severityColor(s: string): string {
  return SEVERITY_COLOR[s] ?? '#6B6356'
}
