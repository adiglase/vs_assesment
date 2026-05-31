export const jobStatuses = ['NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED'] as const
export const locationTypes = ['PHYSICAL', 'REMOTE'] as const

export type JobStatus = typeof jobStatuses[number]
export type LocationType = typeof locationTypes[number]

export type DashboardJobRow = {
  id: number
  case_name: string
  duration_minutes: number
  location_type: LocationType
  city: string | null
  status: JobStatus
  reporter_id: number | null
  reporter_name: string | null
  editor_id: number | null
  editor_name: string | null
  created_at: string
  updated_at: string
  assigned_at: string | null
  transcribed_at: string | null
  reviewed_at: string | null
  completed_at: string | null
  payment_id: number | null
  payment_reporter_amount: number | null
  payment_editor_amount: number | null
  payment_total_amount: number | null
  payment_created_at: string | null
}

export type DashboardJob = {
  id: number
  caseName: string
  durationMinutes: number
  locationType: LocationType
  city: string | null
  status: JobStatus
  reporter: {
    id: number
    name: string
  } | null
  editor: {
    id: number
    name: string
  } | null
  timestamps: {
    createdAt: string
    updatedAt: string
    assignedAt: string | null
    transcribedAt: string | null
    reviewedAt: string | null
    completedAt: string | null
  }
  payout: {
    id: number
    reporterAmount: number
    editorAmount: number
    totalAmount: number
    createdAt: string
  } | null
}
