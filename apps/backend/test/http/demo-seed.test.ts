import { test } from 'node:test'
import * as assert from 'node:assert'
import request from 'supertest'
import { createApp } from '../../src/app'
import { openDatabase, resetDatabase } from '../../src/db/database'

test('default seed data includes reviewer-ready jobs and a payout record', async (t) => {
  const db = openDatabase(':memory:')
  resetDatabase(db)
  t.after(() => {
    db.close()
  })

  const app = request(createApp({ db }))
  const res = await app.get('/jobs')

  assert.equal(res.status, 200)
  assert.equal(res.body.jobs.length, 6)

  const statuses = new Set(res.body.jobs.map((job: { status: string }) => job.status))
  assert.deepStrictEqual(statuses, new Set(['NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED']))

  const transcribedJob = res.body.jobs.find((job: { status: string }) => job.status === 'TRANSCRIBED')
  assert.notEqual(transcribedJob, undefined)
  assert.notEqual(transcribedJob.reporter, null)
  assert.equal(transcribedJob.editor, null)

  const reviewedJob = res.body.jobs.find((job: { status: string }) => job.status === 'REVIEWED')
  assert.notEqual(reviewedJob, undefined)
  assert.notEqual(reviewedJob.editor, null)
  assert.equal(reviewedJob.payout, null)

  const completedJob = res.body.jobs.find((job: { status: string }) => job.status === 'COMPLETED')
  assert.notEqual(completedJob, undefined)
  assert.equal(completedJob.payout.reporterAmount, 160000)
  assert.equal(completedJob.payout.editorAmount, 50000)
  assert.equal(completedJob.payout.totalAmount, 210000)
})
