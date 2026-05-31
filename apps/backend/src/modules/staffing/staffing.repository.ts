import type Database from 'better-sqlite3'
import { serializeEditor, serializeReporter } from './staffing.presenter'
import type { Editor, EditorRow, Reporter, ReporterRow } from './staffing.types'

export function listReporters (db: Database.Database): Reporter[] {
  const rows = db.prepare(`
    SELECT id, name, city, availability
    FROM reporters
    ORDER BY name ASC
  `).all() as ReporterRow[]

  return rows.map(serializeReporter)
}

export function listEditors (db: Database.Database): Editor[] {
  const rows = db.prepare(`
    SELECT id, name, availability
    FROM editors
    ORDER BY name ASC
  `).all() as EditorRow[]

  return rows.map(serializeEditor)
}
