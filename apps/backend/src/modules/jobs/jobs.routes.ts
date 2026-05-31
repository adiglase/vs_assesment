import type Database from 'better-sqlite3'
import { Router } from 'express'
import { sendError } from '../../http/errors'
import { serializeDashboardJob } from './jobs.presenter'
import { createJobSchema } from './jobs.schemas'
import type { DashboardJob, DashboardJobRow } from './jobs.types'

export const jobsRouter = Router()

jobsRouter.post('/jobs', (req, res) => {
  const parsed = createJobSchema.safeParse(req.body)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid job payload')
    return
  }

  const db = req.app.locals.db as Database.Database
  const payload = parsed.data

  const result = db.prepare(`
    INSERT INTO jobs (case_name, duration_minutes, location_type, city)
    VALUES (@caseName, @durationMinutes, @locationType, @city)
  `).run({
    caseName: payload.caseName,
    durationMinutes: payload.durationMinutes,
    locationType: payload.locationType,
    city: payload.locationType === 'PHYSICAL' ? payload.city : null
  })

  const job = getDashboardJobById(db, Number(result.lastInsertRowid))

  res.status(201).json({ job })
})

function getDashboardJobById (db: Database.Database, id: number): DashboardJob {
  const row = db.prepare(`
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
    WHERE jobs.id = ?
  `).get(id) as DashboardJobRow | undefined

  if (row === undefined) {
    throw new Error(`Created job ${id} could not be loaded`)
  }

  return serializeDashboardJob(row)
}
