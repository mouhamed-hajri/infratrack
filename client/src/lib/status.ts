export const STATUS_COLOR: Record<string, { fg: string; bg: string }> = {
  REPORTED:     { fg: '#6B6356', bg: '#6B635614' },
  ACKNOWLEDGED: { fg: '#0F5C5B', bg: '#0F5C5B14' },
  IN_PROGRESS:  { fg: '#B8861E', bg: '#B8861E14' },
  RESOLVED:     { fg: '#3F7D5B', bg: '#3F7D5B14' },
  REJECTED:     { fg: '#A8321F', bg: '#A8321F14' },
}

export const STATUS_LABEL: Record<string, string> = {
  REPORTED:     'Reported',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS:  'In Progress',
  RESOLVED:     'Resolved',
  REJECTED:     'Rejected',
}

// Valid next states per current state — mirrors server NEXT map
// ponytail: client uses this for button rendering only; server re-validates
export const NEXT: Record<string, string[]> = {
  REPORTED:     ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS:  ['RESOLVED', 'REJECTED'],
  RESOLVED:     [],
  REJECTED:     [],
}

export const ACTION_LABEL: Record<string, string> = {
  ACKNOWLEDGED: 'Acknowledge',
  IN_PROGRESS:  'Start work',
  RESOLVED:     'Mark resolved',
  REJECTED:     'Reject',
}
