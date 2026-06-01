// This file contains code that we reuse between our tests.
import * as test from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app'
import { openDatabase, resetDatabase } from '../src/db/database'

export type TestContext = {
  after: typeof test.after
}

export type TestApp = {
  request: ReturnType<typeof request>
  db: ReturnType<typeof openDatabase>
}

async function build (_t: TestContext): Promise<TestApp> {
  const db = openDatabase(':memory:')
  resetDatabase(db, { includeDemoData: false })
  _t.after(() => {
    db.close()
  })

  const app = createApp({ db })

  return {
    request: request(app),
    db
  }
}

export { build }
