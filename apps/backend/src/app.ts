import express, { type Express } from 'express'
import { systemRouter } from './http/system.routes'

export function createApp (): Express {
  const app = express()

  app.use(express.json())
  app.use(systemRouter)

  return app
}

export default createApp
