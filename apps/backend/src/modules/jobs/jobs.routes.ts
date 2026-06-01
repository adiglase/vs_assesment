import type Database from 'better-sqlite3'
import { Router } from 'express'
import { sendError } from '../../http/errors'
import { createJob, listDashboardJobs } from './jobs.repository'
import { assignEditorSchema, assignReporterSchema, createJobSchema, jobIdParamsSchema } from './jobs.schemas'
import { assignEditor, assignReporter, markReviewed, markTranscribed, type WorkflowErrorCode } from './jobs.workflow'

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

jobsRouter.post('/jobs/:id/assign-reporter', (req, res) => {
  const parsedParams = jobIdParamsSchema.safeParse(req.params)

  if (!parsedParams.success) {
    const firstIssue = parsedParams.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid job id')
    return
  }

  const parsedBody = assignReporterSchema.safeParse(req.body ?? {})

  if (!parsedBody.success) {
    const firstIssue = parsedBody.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid reporter assignment payload')
    return
  }

  const db = req.app.locals.db as Database.Database
  const result = assignReporter(db, parsedParams.data.id, parsedBody.data.reporterId)

  if (!result.ok) {
    const { code, message } = result.error
    sendError(res, statusCodeForWorkflowError(code), code, message)
    return
  }

  res.json({ job: result.value })
})

jobsRouter.post('/jobs/:id/mark-transcribed', (req, res) => {
  const parsedParams = jobIdParamsSchema.safeParse(req.params)

  if (!parsedParams.success) {
    const firstIssue = parsedParams.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid job id')
    return
  }

  const db = req.app.locals.db as Database.Database
  const result = markTranscribed(db, parsedParams.data.id)

  if (!result.ok) {
    const { code, message } = result.error
    sendError(res, statusCodeForWorkflowError(code), code, message)
    return
  }

  res.json({ job: result.value })
})

jobsRouter.post('/jobs/:id/assign-editor', (req, res) => {
  const parsedParams = jobIdParamsSchema.safeParse(req.params)

  if (!parsedParams.success) {
    const firstIssue = parsedParams.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid job id')
    return
  }

  const parsedBody = assignEditorSchema.safeParse(req.body ?? {})

  if (!parsedBody.success) {
    const firstIssue = parsedBody.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid editor assignment payload')
    return
  }

  const db = req.app.locals.db as Database.Database
  const result = assignEditor(db, parsedParams.data.id, parsedBody.data.editorId)

  if (!result.ok) {
    const { code, message } = result.error
    sendError(res, statusCodeForWorkflowError(code), code, message)
    return
  }

  res.json({ job: result.value })
})

jobsRouter.post('/jobs/:id/mark-reviewed', (req, res) => {
  const parsedParams = jobIdParamsSchema.safeParse(req.params)

  if (!parsedParams.success) {
    const firstIssue = parsedParams.error.issues[0]
    sendError(res, 400, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid job id')
    return
  }

  const db = req.app.locals.db as Database.Database
  const result = markReviewed(db, parsedParams.data.id)

  if (!result.ok) {
    const { code, message } = result.error
    sendError(res, statusCodeForWorkflowError(code), code, message)
    return
  }

  res.json({ job: result.value })
})

function statusCodeForWorkflowError (code: WorkflowErrorCode): 400 | 404 | 409 {
  if (code === 'REPORTER_REQUIRED') {
    return 400
  }

  if (code === 'JOB_NOT_FOUND' || code === 'REPORTER_NOT_FOUND' || code === 'EDITOR_NOT_FOUND') {
    return 404
  }

  return 409
}
