import type Database from 'better-sqlite3'
import express, { type Express } from 'express'
import { systemRouter } from './http/system.routes'

export type AppDependencies = {
  db: Database.Database
}

export function createApp (dependencies: AppDependencies): Express {
  const app = express()

  app.locals.db = dependencies.db

  app.use(express.json())
  app.use(systemRouter)

  return app
}

export default createApp
