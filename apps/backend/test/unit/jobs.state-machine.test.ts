import { test } from 'node:test'
import * as assert from 'node:assert'
import { canTransitionJobStatus } from '../../src/modules/jobs/jobs.state-machine'
import type { JobStatus } from '../../src/modules/jobs/jobs.types'

test('allows only the court reporting job workflow transitions', () => {
  const allowedTransitions: Array<[JobStatus, JobStatus]> = [
    ['NEW', 'ASSIGNED'],
    ['ASSIGNED', 'TRANSCRIBED'],
    ['TRANSCRIBED', 'REVIEWED'],
    ['REVIEWED', 'COMPLETED']
  ]

  const rejectedTransitions: Array<[JobStatus, JobStatus]> = [
    ['NEW', 'TRANSCRIBED'],
    ['NEW', 'COMPLETED'],
    ['ASSIGNED', 'REVIEWED'],
    ['TRANSCRIBED', 'COMPLETED'],
    ['COMPLETED', 'REVIEWED'],
    ['COMPLETED', 'COMPLETED']
  ]

  for (const [from, to] of allowedTransitions) {
    assert.equal(canTransitionJobStatus(from, to), true, `${from} should transition to ${to}`)
  }

  for (const [from, to] of rejectedTransitions) {
    assert.equal(canTransitionJobStatus(from, to), false, `${from} should not transition to ${to}`)
  }
})
