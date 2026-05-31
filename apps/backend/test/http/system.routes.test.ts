import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('default root route', async (t) => {
  const app = await build(t)

  const res = await app.request.get('/')

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body, { root: true })
})

test('health route', async (t) => {
  const app = await build(t)

  const res = await app.request.get('/health')

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body, { ok: true })
})
