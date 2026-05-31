import { Router } from 'express'

export const systemRouter = Router()

systemRouter.get('/', (_req, res) => {
  res.json({ root: true })
})

systemRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})
