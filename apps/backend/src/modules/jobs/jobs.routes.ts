import type Database from 'better-sqlite3'
import { Router } from 'express'
import { sendError } from '../../http/errors'
import { createJob, listDashboardJobs } from './jobs.repository'
import { createJobSchema } from './jobs.schemas'

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

  const job = createJob(db, {
    caseName: payload.caseName,
    durationMinutes: payload.durationMinutes,
    locationType: payload.locationType,
    city: payload.city ?? null
  })

  res.status(201).json({ job })
})

jobsRouter.get('/jobs', (req, res) => {
  const db = req.app.locals.db as Database.Database
  const jobs = listDashboardJobs(db)

  res.json({ jobs })
})
