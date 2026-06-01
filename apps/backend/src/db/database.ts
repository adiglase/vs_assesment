import Database from 'better-sqlite3'
import { schemaSql } from './schema'
import { seedSql, seedStaffSql } from './seed'

type SeedOptions = {
  includeDemoData?: boolean
}

export function openDatabase (filename: string): Database.Database {
  const db = new Database(filename)
  db.pragma('foreign_keys = ON')
  return db
}

export function migrateDatabase (db: Database.Database): void {
  db.exec(schemaSql)
}

export function seedDatabase (db: Database.Database, options: SeedOptions = {}): void {
  db.exec(options.includeDemoData === false ? seedStaffSql : seedSql)
}

export function resetDatabase (db: Database.Database, options: SeedOptions = {}): void {
  db.exec(`
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS editors;
    DROP TABLE IF EXISTS reporters;
  `)
  migrateDatabase(db)
  seedDatabase(db, options)
}
