import type { Editor, EditorRow, Reporter, ReporterRow } from './staffing.types'

export function serializeReporter (row: ReporterRow): Reporter {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    availability: row.availability === 1
  }
}

export function serializeEditor (row: EditorRow): Editor {
  return {
    id: row.id,
    name: row.name,
    availability: row.availability === 1
  }
}
