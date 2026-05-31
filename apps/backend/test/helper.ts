// This file contains code that we reuse between our tests.
import * as test from 'node:test'
import request from 'supertest'
import { createApp } from '../src/app'

export type TestContext = {
  after: typeof test.after
}

export type TestApp = {
  request: ReturnType<typeof request>
}

async function build (_t: TestContext): Promise<TestApp> {
  const app = createApp()

  return {
    request: request(app)
  }
}

export { build }
