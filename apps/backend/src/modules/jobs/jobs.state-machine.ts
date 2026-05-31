import type { JobStatus } from './jobs.types'

const allowedJobTransitions = {
  NEW: ['ASSIGNED'],
  ASSIGNED: ['TRANSCRIBED'],
  TRANSCRIBED: ['REVIEWED'],
  REVIEWED: ['COMPLETED'],
  COMPLETED: []
} satisfies Record<JobStatus, JobStatus[]>

export function canTransitionJobStatus (from: JobStatus, to: JobStatus): boolean {
  const allowedTargets = allowedJobTransitions[from] as readonly JobStatus[]

  return allowedTargets.includes(to)
}
