import type Database from 'better-sqlite3'
import express, { type Express } from 'express'
import { systemRouter } from './http/system.routes'
import { jobsRouter } from './modules/jobs/jobs.routes'

export type AppDependencies = {
  db: Database.Database
}

export function createApp (dependencies: AppDependencies): Express {
  const app = express()

  app.locals.db = dependencies.db

  app.use(express.json())
  app.use(systemRouter)
  app.use(jobsRouter)

  return app
}

export default createApp
