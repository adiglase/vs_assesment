import { test } from 'node:test'
import * as assert from 'node:assert'
import { build, type TestApp } from '../helper'

test('creates a physical job', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'Jakarta licensing hearing',
      durationMinutes: 75,
      locationType: 'PHYSICAL',
      city: 'Jakarta'
    })

  assert.equal(res.status, 201)
  assert.equal(res.body.job.caseName, 'Jakarta licensing hearing')
  assert.equal(res.body.job.durationMinutes, 75)
  assert.equal(res.body.job.locationType, 'PHYSICAL')
  assert.equal(res.body.job.city, 'Jakarta')
  assert.equal(res.body.job.status, 'NEW')
  assert.equal(res.body.job.reporter, null)
  assert.equal(res.body.job.editor, null)
  assert.equal(res.body.job.payout, null)
  assert.equal(typeof res.body.job.timestamps.createdAt, 'string')
})

test('creating a physical job requires city', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'Jakarta licensing hearing',
      durationMinutes: 75,
      locationType: 'PHYSICAL'
    })

  assert.equal(res.status, 400)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Physical jobs require a city'
    }
  })
})

test('creating a remote job rejects city', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE',
      city: 'Jakarta'
    })

  assert.equal(res.status, 400)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Remote jobs must not include a city'
    }
  })
})

test('creating a job requires a case name', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: '   ',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  assert.equal(res.status, 400)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Case name is required'
    }
  })
})

test('creating a job requires a positive duration', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 0,
      locationType: 'REMOTE'
    })

  assert.equal(res.status, 400)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Duration must be greater than zero'
    }
  })
})

test('creating a job rejects invalid location type', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'HYBRID'
    })

  assert.equal(res.status, 400)
  assert.equal(res.body.error.code, 'VALIDATION_ERROR')
})

test('lists created jobs for the dashboard', async (t) => {
  const app = await build(t)

  await app.request
    .post('/jobs')
    .send({
      caseName: 'Jakarta licensing hearing',
      durationMinutes: 75,
      locationType: 'PHYSICAL',
      city: 'Jakarta'
    })

  await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request.get('/jobs')

  assert.equal(res.status, 200)
  assert.equal(res.body.jobs.length, 2)
  assert.equal(res.body.jobs[0].caseName, 'Remote deposition')
  assert.equal(res.body.jobs[0].city, null)
  assert.equal(res.body.jobs[0].reporter, null)
  assert.equal(res.body.jobs[0].editor, null)
  assert.equal(res.body.jobs[0].payout, null)
  assert.equal(res.body.jobs[1].caseName, 'Jakarta licensing hearing')
  assert.equal(res.body.jobs[1].city, 'Jakarta')
})

test('job list includes assignment and payout fields', async (t) => {
  const app = await build(t)

  app.db.prepare(`
    INSERT INTO jobs (
      case_name,
      duration_minutes,
      location_type,
      city,
      status,
      reporter_id,
      editor_id,
      assigned_at,
      transcribed_at,
      reviewed_at,
      completed_at
    )
    VALUES (
      'Completed matter',
      30,
      'PHYSICAL',
      'Jakarta',
      'COMPLETED',
      1,
      1,
      datetime('now'),
      datetime('now'),
      datetime('now'),
      datetime('now')
    )
  `).run()

  app.db.prepare(`
    INSERT INTO payments (
      job_id,
      reporter_id,
      editor_id,
      reporter_amount,
      editor_amount,
      total_amount
    )
    VALUES (1, 1, 1, 60000, 50000, 110000)
  `).run()

  const res = await app.request.get('/jobs')

  assert.equal(res.status, 200)
  assert.equal(res.body.jobs.length, 1)
  assert.deepStrictEqual(res.body.jobs[0].reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
  assert.deepStrictEqual(res.body.jobs[0].editor, {
    id: 1,
    name: 'Dewi Lestari'
  })
  assert.equal(res.body.jobs[0].payout.id, 1)
  assert.equal(res.body.jobs[0].payout.reporterAmount, 60000)
  assert.equal(res.body.jobs[0].payout.editorAmount, 50000)
  assert.equal(res.body.jobs[0].payout.totalAmount, 110000)
  assert.equal(typeof res.body.jobs[0].payout.createdAt, 'string')
})

test('assigning a reporter moves a new job to assigned', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Jakarta licensing hearing',
      durationMinutes: 75,
      locationType: 'PHYSICAL',
      city: 'Jakarta'
    })

  const res = await app.request.post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'ASSIGNED')
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
  assert.equal(typeof res.body.job.timestamps.assignedAt, 'string')
  assert.equal(typeof res.body.job.timestamps.updatedAt, 'string')
})

test('assigning a reporter prefers an available same-city reporter for physical jobs', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Bandung hearing',
      durationMinutes: 60,
      locationType: 'PHYSICAL',
      city: 'Bandung'
    })

  const res = await app.request.post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 2,
    name: 'Bima Santoso'
  })
})

test('assigning a reporter falls back to the first available reporter by name', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Surabaya hearing',
      durationMinutes: 50,
      locationType: 'PHYSICAL',
      city: 'Surabaya'
    })

  const res = await app.request.post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
})

test('assigning a reporter to a remote job requires a selected reporter', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request.post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)

  assert.equal(res.status, 400)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'REPORTER_REQUIRED',
      message: 'Remote jobs require a selected reporter'
    }
  })
})

test('assigning a reporter to a remote job uses the selected available reporter', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request
    .post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)
    .send({ reporterId: 2 })

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'ASSIGNED')
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 2,
    name: 'Bima Santoso'
  })
})

test('assigning an unavailable reporter to a remote job fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request
    .post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)
    .send({ reporterId: 3 })

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'REPORTER_UNAVAILABLE',
      message: 'Reporter is not available'
    }
  })
})

test('assigning a missing reporter to a remote job fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request
    .post(`/jobs/${String(createRes.body.job.id)}/assign-reporter`)
    .send({ reporterId: 999 })

  assert.equal(res.status, 404)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'REPORTER_NOT_FOUND',
      message: 'Reporter was not found'
    }
  })
})

test('assigning a reporter twice fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const jobId = createRes.body.job.id

  const firstRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 1 })
  const secondRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 2 })

  assert.equal(firstRes.status, 200)
  assert.equal(secondRes.status, 409)
  assert.deepStrictEqual(secondRes.body, {
    error: {
      code: 'JOB_ALREADY_ASSIGNED',
      message: 'Job is already assigned'
    }
  })
})

test('concurrent reporter assignment allows exactly one winner', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const jobId = createRes.body.job.id
  const responses = await Promise.all([
    app.request
      .post(`/jobs/${String(jobId)}/assign-reporter`)
      .send({ reporterId: 1 }),
    app.request
      .post(`/jobs/${String(jobId)}/assign-reporter`)
      .send({ reporterId: 1 })
  ])

  const successfulResponses = responses.filter((res) => res.status === 200)
  const conflictResponses = responses.filter((res) => res.status === 409)

  assert.equal(successfulResponses.length, 1)
  assert.equal(conflictResponses.length, 1)
  assert.equal(conflictResponses[0].body.error.code, 'JOB_ALREADY_ASSIGNED')

  const jobsRes = await app.request.get('/jobs')

  assert.equal(jobsRes.status, 200)
  assert.equal(jobsRes.body.jobs[0].status, 'ASSIGNED')
  assert.deepStrictEqual(jobsRes.body.jobs[0].reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
})

test('marking an assigned job transcribed moves it to transcribed', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const jobId = createRes.body.job.id

  await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 1 })

  const res = await app.request.post(`/jobs/${String(jobId)}/mark-transcribed`)

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'TRANSCRIBED')
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
  assert.equal(res.body.job.editor, null)
  assert.equal(typeof res.body.job.timestamps.transcribedAt, 'string')
  assert.equal(typeof res.body.job.timestamps.updatedAt, 'string')
})

test('marking a new job transcribed fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request.post(`/jobs/${String(createRes.body.job.id)}/mark-transcribed`)

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Marking transcribed requires an assigned job'
    }
  })
})

test('marking a transcribed job transcribed again fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const jobId = createRes.body.job.id

  await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 1 })

  const firstRes = await app.request.post(`/jobs/${String(jobId)}/mark-transcribed`)
  const secondRes = await app.request.post(`/jobs/${String(jobId)}/mark-transcribed`)

  assert.equal(firstRes.status, 200)
  assert.equal(secondRes.status, 409)
  assert.deepStrictEqual(secondRes.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Marking transcribed requires an assigned job'
    }
  })
})

test('assigning an editor to a transcribed job stores the editor without changing status', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const res = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'TRANSCRIBED')
  assert.deepStrictEqual(res.body.job.editor, {
    id: 1,
    name: 'Dewi Lestari'
  })
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
  assert.equal(typeof res.body.job.timestamps.updatedAt, 'string')
})

test('assigning an editor before transcription fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const res = await app.request
    .post(`/jobs/${String(createRes.body.job.id)}/assign-editor`)
    .send({ editorId: 1 })

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Editor assignment requires a transcribed job'
    }
  })
})

test('assigning an unavailable editor fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const res = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 3 })

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'EDITOR_UNAVAILABLE',
      message: 'Editor is not available'
    }
  })
})

test('assigning a missing editor fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const res = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 999 })

  assert.equal(res.status, 404)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'EDITOR_NOT_FOUND',
      message: 'Editor was not found'
    }
  })
})

test('assigning an editor twice fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const firstRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })
  const secondRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 2 })

  assert.equal(firstRes.status, 200)
  assert.equal(secondRes.status, 409)
  assert.deepStrictEqual(secondRes.body, {
    error: {
      code: 'EDITOR_ALREADY_ASSIGNED',
      message: 'Job already has an assigned editor'
    }
  })
})

test('concurrent editor assignment allows exactly one winner', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const responses = await Promise.all([
    app.request
      .post(`/jobs/${String(jobId)}/assign-editor`)
      .send({ editorId: 1 }),
    app.request
      .post(`/jobs/${String(jobId)}/assign-editor`)
      .send({ editorId: 2 })
  ])

  const successfulResponses = responses.filter((res) => res.status === 200)
  const conflictResponses = responses.filter((res) => res.status === 409)

  assert.equal(successfulResponses.length, 1)
  assert.equal(conflictResponses.length, 1)
  assert.equal(conflictResponses[0].body.error.code, 'EDITOR_ALREADY_ASSIGNED')

  const jobsRes = await app.request.get('/jobs')

  assert.equal(jobsRes.status, 200)
  assert.equal(jobsRes.body.jobs[0].status, 'TRANSCRIBED')
  assert.notEqual(jobsRes.body.jobs[0].editor, null)
})

test('marking a transcribed job with an editor reviewed moves it to reviewed', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const assignEditorRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })

  assert.equal(assignEditorRes.status, 200)

  const res = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'REVIEWED')
  assert.deepStrictEqual(res.body.job.reporter, {
    id: 1,
    name: 'Amelia Hart'
  })
  assert.deepStrictEqual(res.body.job.editor, {
    id: 1,
    name: 'Dewi Lestari'
  })
  assert.equal(typeof res.body.job.timestamps.reviewedAt, 'string')
  assert.equal(typeof res.body.job.timestamps.updatedAt, 'string')
  assert.equal(res.body.job.payout, null)
})

test('marking reviewed without an assigned editor fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  const res = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'EDITOR_REQUIRED',
      message: 'Marking reviewed requires an assigned editor'
    }
  })
})

test('marking an assigned job reviewed fails', async (t) => {
  const app = await build(t)

  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  const jobId = createRes.body.job.id

  await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 1 })

  const res = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Marking reviewed requires a transcribed job'
    }
  })
})

test('marking a reviewed job reviewed again fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })

  const firstRes = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)
  const secondRes = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)

  assert.equal(firstRes.status, 200)
  assert.equal(secondRes.status, 409)
  assert.deepStrictEqual(secondRes.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Marking reviewed requires a transcribed job'
    }
  })
})

test('completing a reviewed job creates one payout record', async (t) => {
  const app = await build(t)
  const jobId = await createReviewedRemoteJob(app)

  const res = await app.request.post(`/jobs/${String(jobId)}/complete`)

  assert.equal(res.status, 200)
  assert.equal(res.body.job.status, 'COMPLETED')
  assert.equal(typeof res.body.job.timestamps.completedAt, 'string')
  assert.deepStrictEqual(res.body.job.payout, {
    id: 1,
    reporterAmount: 90000,
    editorAmount: 50000,
    totalAmount: 140000,
    createdAt: res.body.job.payout.createdAt
  })
  assert.equal(typeof res.body.job.payout.createdAt, 'string')

  const paymentCount = app.db.prepare(`
    SELECT COUNT(*) AS count
    FROM payments
    WHERE job_id = ?
  `).get(jobId) as { count: number }

  assert.equal(paymentCount.count, 1)
})

test('completing a transcribed job fails', async (t) => {
  const app = await build(t)
  const jobId = await createTranscribedRemoteJob(app)

  await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })

  const res = await app.request.post(`/jobs/${String(jobId)}/complete`)

  assert.equal(res.status, 409)
  assert.deepStrictEqual(res.body, {
    error: {
      code: 'INVALID_JOB_STATUS',
      message: 'Completing a job requires a reviewed job'
    }
  })
})

test('completing a job twice fails without creating a duplicate payout', async (t) => {
  const app = await build(t)
  const jobId = await createReviewedRemoteJob(app)

  const firstRes = await app.request.post(`/jobs/${String(jobId)}/complete`)
  const secondRes = await app.request.post(`/jobs/${String(jobId)}/complete`)

  assert.equal(firstRes.status, 200)
  assert.equal(secondRes.status, 409)
  assert.deepStrictEqual(secondRes.body, {
    error: {
      code: 'PAYOUT_ALREADY_EXISTS',
      message: 'Job already has a payout record'
    }
  })

  const paymentCount = app.db.prepare(`
    SELECT COUNT(*) AS count
    FROM payments
    WHERE job_id = ?
  `).get(jobId) as { count: number }

  assert.equal(paymentCount.count, 1)
})

test('concurrent completion creates at most one payout record', async (t) => {
  const app = await build(t)
  const jobId = await createReviewedRemoteJob(app)

  const responses = await Promise.all([
    app.request.post(`/jobs/${String(jobId)}/complete`),
    app.request.post(`/jobs/${String(jobId)}/complete`)
  ])

  const successfulResponses = responses.filter((res) => res.status === 200)
  const conflictResponses = responses.filter((res) => res.status === 409)

  assert.equal(successfulResponses.length, 1)
  assert.equal(conflictResponses.length, 1)
  assert.equal(conflictResponses[0].body.error.code, 'PAYOUT_ALREADY_EXISTS')

  const paymentCount = app.db.prepare(`
    SELECT COUNT(*) AS count
    FROM payments
    WHERE job_id = ?
  `).get(jobId) as { count: number }

  assert.equal(paymentCount.count, 1)

  const jobsRes = await app.request.get('/jobs')

  assert.equal(jobsRes.status, 200)
  assert.equal(jobsRes.body.jobs[0].status, 'COMPLETED')
  assert.notEqual(jobsRes.body.jobs[0].payout, null)
})

async function createReviewedRemoteJob (app: TestApp): Promise<number> {
  const jobId = await createTranscribedRemoteJob(app)

  const assignEditorRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-editor`)
    .send({ editorId: 1 })

  assert.equal(assignEditorRes.status, 200)

  const markReviewedRes = await app.request.post(`/jobs/${String(jobId)}/mark-reviewed`)

  assert.equal(markReviewedRes.status, 200)

  return jobId
}

async function createTranscribedRemoteJob (app: TestApp): Promise<number> {
  const createRes = await app.request
    .post('/jobs')
    .send({
      caseName: 'Remote deposition',
      durationMinutes: 45,
      locationType: 'REMOTE'
    })

  assert.equal(createRes.status, 201)

  const jobId = createRes.body.job.id

  const assignReporterRes = await app.request
    .post(`/jobs/${String(jobId)}/assign-reporter`)
    .send({ reporterId: 1 })

  assert.equal(assignReporterRes.status, 200)

  const markTranscribedRes = await app.request.post(`/jobs/${String(jobId)}/mark-transcribed`)

  assert.equal(markTranscribedRes.status, 200)

  return jobId
}
