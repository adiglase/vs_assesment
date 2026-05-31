import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createApp } from './app'
import { openDatabase } from './db/database'

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'
const dbPath = resolve(process.env.DATABASE_PATH ?? 'data/voicescript.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })

const db = openDatabase(dbPath)
const app = createApp({ db })

const server = app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`)
})

function shutdown (): void {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
