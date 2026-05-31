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
