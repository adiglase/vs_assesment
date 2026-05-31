import Database from 'better-sqlite3'
import { schemaSql } from './schema'
import { seedSql } from './seed'

export function openDatabase (filename: string): Database.Database {
  const db = new Database(filename)
  db.pragma('foreign_keys = ON')
  return db
}

export function migrateDatabase (db: Database.Database): void {
  db.exec(schemaSql)
}

export function seedDatabase (db: Database.Database): void {
  db.exec(seedSql)
}

export function resetDatabase (db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS editors;
    DROP TABLE IF EXISTS reporters;
  `)
  migrateDatabase(db)
  seedDatabase(db)
}
