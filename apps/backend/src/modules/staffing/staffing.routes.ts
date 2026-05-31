import type Database from 'better-sqlite3'
import { Router } from 'express'
import { listEditors, listReporters } from './staffing.repository'

export const staffingRouter = Router()

staffingRouter.get('/reporters', (req, res) => {
  const db = req.app.locals.db as Database.Database
  const reporters = listReporters(db)

  res.json({ reporters })
})

staffingRouter.get('/editors', (req, res) => {
  const db = req.app.locals.db as Database.Database
  const editors = listEditors(db)

  res.json({ editors })
})
