import type Database from 'better-sqlite3'
import {
  assignReporterToJob,
  findAvailableReporterForJob,
  getDashboardJobById
} from './jobs.repository'
import { canTransitionJobStatus } from './jobs.state-machine'
import type { DashboardJob } from './jobs.types'

export type WorkflowErrorCode =
  | 'JOB_NOT_FOUND'
  | 'JOB_ALREADY_ASSIGNED'
  | 'INVALID_JOB_STATUS'
  | 'NO_AVAILABLE_REPORTER'
  | 'REPORTER_ASSIGNMENT_CONFLICT'

type WorkflowFailure = {
  code: WorkflowErrorCode
  message: string
}

type WorkflowResult<T> =
  | { ok: true, value: T }
  | { ok: false, error: WorkflowFailure }

const reporterAssignmentTargetStatus = 'ASSIGNED'

export function assignReporter (db: Database.Database, jobId: number): WorkflowResult<DashboardJob> {
  const run = db.transaction((id: number): WorkflowResult<DashboardJob> => {
    const job = getDashboardJobById(db, id)

    if (job === null) {
      return failure('JOB_NOT_FOUND', 'Job was not found')
    }

    const validationFailure = validateReporterAssignment(job)
    if (validationFailure !== null) {
      return validationFailure
    }

    const reporter = findAvailableReporterForJob(db, job)

    if (reporter === null) {
      return failure('NO_AVAILABLE_REPORTER', 'No available reporter could be assigned')
    }

    const assigned = assignReporterToJob(db, id, reporter.id)

    if (!assigned) {
      return reporterAssignmentConflict(db, id)
    }

    const assignedJob = getDashboardJobById(db, id)

    if (assignedJob === null) {
      throw new Error(`Assigned job ${String(id)} could not be loaded`)
    }

    return success(assignedJob)
  })

  return run(jobId)
}

function validateReporterAssignment (job: DashboardJob): WorkflowResult<never> | null {
  if (job.reporter !== null) {
    return failure('JOB_ALREADY_ASSIGNED', 'Job is already assigned')
  }

  if (!canTransitionJobStatus(job.status, reporterAssignmentTargetStatus)) {
    return failure('INVALID_JOB_STATUS', 'Reporter assignment requires a new job')
  }

  return null
}

function reporterAssignmentConflict (
  db: Database.Database,
  jobId: number
): WorkflowResult<never> {
  const latestJob = getDashboardJobById(db, jobId)

  if (latestJob === null) {
    return failure('JOB_NOT_FOUND', 'Job was not found')
  }

  const validationFailure = validateReporterAssignment(latestJob)
  if (validationFailure !== null) {
    return validationFailure
  }

  return failure(
    'REPORTER_ASSIGNMENT_CONFLICT',
    'Job could not be assigned because its workflow state changed'
  )
}

function success<T> (value: T): WorkflowResult<T> {
  return {
    ok: true,
    value
  }
}

function failure (
  code: WorkflowFailure['code'],
  message: string
): WorkflowResult<never> {
  return {
    ok: false,
    error: {
      code,
      message
    }
  }
}
