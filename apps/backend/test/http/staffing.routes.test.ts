import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('lists seeded reporters with availability', async (t) => {
  const app = await build(t)

  const res = await app.request.get('/reporters')

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body, {
    reporters: [
      {
        id: 1,
        name: 'Amelia Hart',
        city: 'Jakarta',
        availability: true
      },
      {
        id: 2,
        name: 'Bima Santoso',
        city: 'Bandung',
        availability: true
      },
      {
        id: 3,
        name: 'Clara Wijaya',
        city: 'Jakarta',
        availability: false
      }
    ]
  })
})

test('lists seeded editors with availability', async (t) => {
  const app = await build(t)

  const res = await app.request.get('/editors')

  assert.equal(res.status, 200)
  assert.deepStrictEqual(res.body, {
    editors: [
      {
        id: 1,
        name: 'Dewi Lestari',
        availability: true
      },
      {
        id: 2,
        name: 'Evan Brooks',
        availability: true
      },
      {
        id: 3,
        name: 'Farah Quinn',
        availability: false
      }
    ]
  })
})
