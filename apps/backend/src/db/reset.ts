import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { openDatabase, resetDatabase } from './database'

const dbPath = resolve(process.env.DATABASE_PATH ?? 'data/voicescript.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })

const db = openDatabase(dbPath)

try {
  resetDatabase(db)
  console.log(`SQLite database reset at ${dbPath}`)
} finally {
  db.close()
}
