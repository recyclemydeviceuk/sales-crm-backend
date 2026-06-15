// Default pipeline stages used to seed the "stages" list.
// Kept in sync with the frontend's src/data/constants.js (DEFAULT_STAGES).
export const DEFAULT_STAGES = [
  { name: 'New',            color: '#7585a0' },
  { name: 'Contacted',      color: '#2a5cd0' },
  { name: 'Follow-Up',      color: '#e0991f' },
  { name: 'Interested',     color: '#16a97d' },
  { name: 'Converted',      color: '#2fb84a' },
  { name: 'Not Interested', color: '#e05757' },
]

// Map between the API path segment and the stored ListItem `type`.
export const LIST_TYPES = {
  stages: 'stage',
  sources: 'source',
  colleges: 'college',
  cities: 'city',
}

// Which lead field each list type cascades onto.
export const LIST_FIELD = {
  stage: 'status',
  source: 'source',
  college: 'college',
  city: 'city',
}

export const LEAD_FIELDS = [
  'source', 'dateOfCalling', 'counselor', 'college', 'firstName', 'lastName',
  'email', 'city', 'countryCode', 'phone', 'program', 'callStatus',
  'callDisposition', 'orientationStatus', 'remark', 'status',
]
