export type ReporterRow = {
  id: number
  name: string
  city: string
  availability: 0 | 1
}

export type EditorRow = {
  id: number
  name: string
  availability: 0 | 1
}

export type Reporter = {
  id: number
  name: string
  city: string
  availability: boolean
}

export type Editor = {
  id: number
  name: string
  availability: boolean
}
