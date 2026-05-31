import type Database from 'better-sqlite3'
import {
  assignReporterToJob,
  findAvailableReporterForJob,
  getDashboardJobById
} from './jobs.repository'
import type { DashboardJob } from './jobs.types'

type WorkflowFailure = {
  statusCode: 404 | 409
  code: string
  message: string
}

type WorkflowResult<T> =
  | { ok: true, value: T }
  | { ok: false, error: WorkflowFailure }

export function assignReporter (db: Database.Database, jobId: number): WorkflowResult<DashboardJob> {
  const run = db.transaction((id: number): WorkflowResult<DashboardJob> => {
    const job = getDashboardJobById(db, id)

    if (job === null) {
      return {
        ok: false,
        error: {
          statusCode: 404,
          code: 'JOB_NOT_FOUND',
          message: 'Job was not found'
        }
      }
    }

    if (job.reporter !== null) {
      return {
        ok: false,
        error: {
          statusCode: 409,
          code: 'JOB_ALREADY_ASSIGNED',
          message: 'Job is already assigned'
        }
      }
    }

    if (job.status !== 'NEW') {
      return {
        ok: false,
        error: {
          statusCode: 409,
          code: 'INVALID_JOB_STATUS',
          message: 'Reporter assignment requires a new job'
        }
      }
    }

    const reporter = findAvailableReporterForJob(db, job)

    if (reporter === null) {
      return {
        ok: false,
        error: {
          statusCode: 409,
          code: 'NO_AVAILABLE_REPORTER',
          message: 'No available reporter could be assigned'
        }
      }
    }

    const assigned = assignReporterToJob(db, id, reporter.id)

    if (!assigned) {
      const latestJob = getDashboardJobById(db, id)

      if (latestJob === null) {
        return {
          ok: false,
          error: {
            statusCode: 404,
            code: 'JOB_NOT_FOUND',
            message: 'Job was not found'
          }
        }
      }

      return {
        ok: false,
        error: {
          statusCode: 409,
          code: latestJob.reporter === null ? 'REPORTER_ASSIGNMENT_CONFLICT' : 'JOB_ALREADY_ASSIGNED',
          message: latestJob.reporter === null
            ? 'Job could not be assigned because its workflow state changed'
            : 'Job is already assigned'
        }
      }
    }

    const assignedJob = getDashboardJobById(db, id)

    if (assignedJob === null) {
      throw new Error(`Assigned job ${String(id)} could not be loaded`)
    }

    return {
      ok: true,
      value: assignedJob
    }
  })

  return run(jobId)
}
