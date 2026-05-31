import type Database from 'better-sqlite3'
import { serializeDashboardJob } from './jobs.presenter'
import type { DashboardJob, DashboardJobRow, LocationType } from './jobs.types'

type CreateJobInput = {
  caseName: string
  durationMinutes: number
  locationType: LocationType
  city: string | null
}

const dashboardJobSelect = `
  SELECT
    jobs.id,
    jobs.case_name,
    jobs.duration_minutes,
    jobs.location_type,
    jobs.city,
    jobs.status,
    jobs.reporter_id,
    reporters.name AS reporter_name,
    jobs.editor_id,
    editors.name AS editor_name,
    jobs.created_at,
    jobs.updated_at,
    jobs.assigned_at,
    jobs.transcribed_at,
    jobs.reviewed_at,
    jobs.completed_at,
    payments.id AS payment_id,
    payments.reporter_amount AS payment_reporter_amount,
    payments.editor_amount AS payment_editor_amount,
    payments.total_amount AS payment_total_amount,
    payments.created_at AS payment_created_at
  FROM jobs
  LEFT JOIN reporters ON reporters.id = jobs.reporter_id
  LEFT JOIN editors ON editors.id = jobs.editor_id
  LEFT JOIN payments ON payments.job_id = jobs.id
`

export function createJob (db: Database.Database, input: CreateJobInput): DashboardJob {
  const result = db.prepare(`
    INSERT INTO jobs (case_name, duration_minutes, location_type, city)
    VALUES (@caseName, @durationMinutes, @locationType, @city)
  `).run(input)

  const job = getDashboardJobById(db, Number(result.lastInsertRowid))

  if (job === null) {
    throw new Error(`Created job ${String(result.lastInsertRowid)} could not be loaded`)
  }

  return job
}

export function listDashboardJobs (db: Database.Database): DashboardJob[] {
  const rows = db.prepare(`
    ${dashboardJobSelect}
    ORDER BY jobs.id ASC
  `).all() as DashboardJobRow[]

  return rows.map(serializeDashboardJob)
}

function getDashboardJobById (db: Database.Database, id: number): DashboardJob | null {
  const row = db.prepare(`
    ${dashboardJobSelect}
    WHERE jobs.id = ?
  `).get(id) as DashboardJobRow | undefined

  return row === undefined ? null : serializeDashboardJob(row)
}
