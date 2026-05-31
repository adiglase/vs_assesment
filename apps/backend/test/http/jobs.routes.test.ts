import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('creates a physical job', async (t) => {
  const app = await build(t)

  const res = await app.request
    .post('/jobs')
    .send({
      caseName: 'State v. Hart',
      durationMinutes: 75,
      locationType: 'PHYSICAL',
      city: 'Jakarta'
    })

  assert.equal(res.status, 201)
  assert.equal(res.body.job.caseName, 'State v. Hart')
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
      caseName: 'State v. Hart',
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

test('lists created jobs for the dashboard', async (t) => {
  const app = await build(t)

  await app.request
    .post('/jobs')
    .send({
      caseName: 'State v. Hart',
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
  assert.equal(res.body.jobs[0].caseName, 'State v. Hart')
  assert.equal(res.body.jobs[0].city, 'Jakarta')
  assert.equal(res.body.jobs[0].reporter, null)
  assert.equal(res.body.jobs[0].editor, null)
  assert.equal(res.body.jobs[0].payout, null)
  assert.equal(res.body.jobs[1].caseName, 'Remote deposition')
  assert.equal(res.body.jobs[1].city, null)
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
