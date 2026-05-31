import type { DashboardJob, DashboardJobRow } from './jobs.types'

export function serializeDashboardJob (row: DashboardJobRow): DashboardJob {
  return {
    id: row.id,
    caseName: row.case_name,
    durationMinutes: row.duration_minutes,
    locationType: row.location_type,
    city: row.city,
    status: row.status,
    reporter: row.reporter_id === null || row.reporter_name === null
      ? null
      : {
          id: row.reporter_id,
          name: row.reporter_name
        },
    editor: row.editor_id === null || row.editor_name === null
      ? null
      : {
          id: row.editor_id,
          name: row.editor_name
        },
    timestamps: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedAt: row.assigned_at,
      transcribedAt: row.transcribed_at,
      reviewedAt: row.reviewed_at,
      completedAt: row.completed_at
    },
    payout: row.payment_id === null
      ? null
      : {
          id: row.payment_id,
          reporterAmount: row.payment_reporter_amount ?? 0,
          editorAmount: row.payment_editor_amount ?? 0,
          totalAmount: row.payment_total_amount ?? 0,
          createdAt: row.payment_created_at ?? ''
        }
  }
}
