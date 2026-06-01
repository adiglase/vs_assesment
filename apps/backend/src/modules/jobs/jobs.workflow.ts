import type Database from 'better-sqlite3'
import {
  assignEditorToJob,
  assignReporterToJob,
  findAvailableReporterForJob,
  getDashboardJobById,
  getEditorForAssignment,
  getReporterForAssignment,
  markJobTranscribed
} from './jobs.repository'
import { canTransitionJobStatus } from './jobs.state-machine'
import type { DashboardJob, ReporterAssignmentCandidate } from './jobs.types'

export type WorkflowErrorCode =
  | 'JOB_NOT_FOUND'
  | 'JOB_ALREADY_ASSIGNED'
  | 'INVALID_JOB_STATUS'
  | 'REPORTER_REQUIRED'
  | 'REPORTER_NOT_FOUND'
  | 'REPORTER_UNAVAILABLE'
  | 'NO_AVAILABLE_REPORTER'
  | 'REPORTER_ASSIGNMENT_CONFLICT'
  | 'EDITOR_NOT_FOUND'
  | 'EDITOR_UNAVAILABLE'
  | 'EDITOR_ALREADY_ASSIGNED'
  | 'EDITOR_ASSIGNMENT_CONFLICT'

type WorkflowFailure = {
  code: WorkflowErrorCode
  message: string
}

type WorkflowResult<T> =
  | { ok: true, value: T }
  | { ok: false, error: WorkflowFailure }

const reporterAssignmentTargetStatus = 'ASSIGNED'
const editorAssignmentRequiredStatus = 'TRANSCRIBED'
const markTranscribedTargetStatus = 'TRANSCRIBED'

export function assignReporter (
  db: Database.Database,
  jobId: number,
  reporterId?: number
): WorkflowResult<DashboardJob> {
  const run = db.transaction((id: number): WorkflowResult<DashboardJob> => {
    const job = getDashboardJobById(db, id)

    if (job === null) {
      return failure('JOB_NOT_FOUND', 'Job was not found')
    }

    const validationFailure = validateReporterAssignment(job)
    if (validationFailure !== null) {
      return validationFailure
    }

    const reporter = selectReporterForJob(db, job, reporterId)

    if (!reporter.ok) {
      return reporter
    }

    const assigned = assignReporterToJob(db, id, reporter.value.id)

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

export function markTranscribed (
  db: Database.Database,
  jobId: number
): WorkflowResult<DashboardJob> {
  const run = db.transaction((id: number): WorkflowResult<DashboardJob> => {
    const job = getDashboardJobById(db, id)

    if (job === null) {
      return failure('JOB_NOT_FOUND', 'Job was not found')
    }

    if (!canTransitionJobStatus(job.status, markTranscribedTargetStatus)) {
      return failure('INVALID_JOB_STATUS', 'Marking transcribed requires an assigned job')
    }

    const marked = markJobTranscribed(db, id)

    if (!marked) {
      return failure(
        'INVALID_JOB_STATUS',
        'Job could not be marked transcribed because its workflow state changed'
      )
    }

    const transcribedJob = getDashboardJobById(db, id)

    if (transcribedJob === null) {
      throw new Error(`Transcribed job ${String(id)} could not be loaded`)
    }

    return success(transcribedJob)
  })

  return run(jobId)
}

export function assignEditor (
  db: Database.Database,
  jobId: number,
  editorId: number
): WorkflowResult<DashboardJob> {
  const run = db.transaction((id: number): WorkflowResult<DashboardJob> => {
    const job = getDashboardJobById(db, id)

    if (job === null) {
      return failure('JOB_NOT_FOUND', 'Job was not found')
    }

    const validationFailure = validateEditorAssignment(job)
    if (validationFailure !== null) {
      return validationFailure
    }

    const editor = getEditorForAssignment(db, editorId)

    if (editor === null) {
      return failure('EDITOR_NOT_FOUND', 'Editor was not found')
    }

    if (!editor.availability) {
      return failure('EDITOR_UNAVAILABLE', 'Editor is not available')
    }

    const assigned = assignEditorToJob(db, id, editor.id)

    if (!assigned) {
      return editorAssignmentConflict(db, id)
    }

    const assignedJob = getDashboardJobById(db, id)

    if (assignedJob === null) {
      throw new Error(`Editor-assigned job ${String(id)} could not be loaded`)
    }

    return success(assignedJob)
  })

  return run(jobId)
}

function selectReporterForJob (
  db: Database.Database,
  job: DashboardJob,
  reporterId?: number
): WorkflowResult<ReporterAssignmentCandidate> {
  if (job.locationType === 'REMOTE') {
    if (reporterId === undefined) {
      return failure('REPORTER_REQUIRED', 'Remote jobs require a selected reporter')
    }

    const reporter = getReporterForAssignment(db, reporterId)

    if (reporter === null) {
      return failure('REPORTER_NOT_FOUND', 'Reporter was not found')
    }

    if (!reporter.availability) {
      return failure('REPORTER_UNAVAILABLE', 'Reporter is not available')
    }

    return success({
      id: reporter.id,
      name: reporter.name,
      city: reporter.city
    })
  }

  const reporter = findAvailableReporterForJob(db, job)

  if (reporter === null) {
    return failure('NO_AVAILABLE_REPORTER', 'No available reporter could be assigned')
  }

  return success(reporter)
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

function validateEditorAssignment (job: DashboardJob): WorkflowResult<never> | null {
  if (job.editor !== null) {
    return failure('EDITOR_ALREADY_ASSIGNED', 'Job already has an assigned editor')
  }

  if (job.status !== editorAssignmentRequiredStatus) {
    return failure('INVALID_JOB_STATUS', 'Editor assignment requires a transcribed job')
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

function editorAssignmentConflict (
  db: Database.Database,
  jobId: number
): WorkflowResult<never> {
  const latestJob = getDashboardJobById(db, jobId)

  if (latestJob === null) {
    return failure('JOB_NOT_FOUND', 'Job was not found')
  }

  const validationFailure = validateEditorAssignment(latestJob)
  if (validationFailure !== null) {
    return validationFailure
  }

  return failure(
    'EDITOR_ASSIGNMENT_CONFLICT',
    'Job could not be assigned an editor because its workflow state changed'
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
