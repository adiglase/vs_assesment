export const schemaSql = `
CREATE TABLE IF NOT EXISTS reporters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  availability INTEGER NOT NULL CHECK (availability IN (0, 1))
);

CREATE TABLE IF NOT EXISTS editors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  availability INTEGER NOT NULL CHECK (availability IN (0, 1))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  location_type TEXT NOT NULL CHECK (location_type IN ('PHYSICAL', 'REMOTE')),
  city TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'ASSIGNED', 'TRANSCRIBED', 'REVIEWED', 'COMPLETED')
  ),
  reporter_id INTEGER REFERENCES reporters(id),
  editor_id INTEGER REFERENCES editors(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_at TEXT,
  transcribed_at TEXT,
  reviewed_at TEXT,
  completed_at TEXT,
  CHECK (trim(case_name) != ''),
  CHECK (
    (location_type = 'PHYSICAL' AND city IS NOT NULL AND trim(city) != '')
    OR
    (location_type = 'REMOTE' AND city IS NULL)
  ),
  CHECK (
    (status = 'NEW' AND reporter_id IS NULL AND editor_id IS NULL)
    OR
    (status = 'ASSIGNED' AND reporter_id IS NOT NULL AND editor_id IS NULL)
    OR
    (status = 'TRANSCRIBED' AND reporter_id IS NOT NULL)
    OR
    (status = 'REVIEWED' AND reporter_id IS NOT NULL AND editor_id IS NOT NULL)
    OR
    (status = 'COMPLETED' AND reporter_id IS NOT NULL AND editor_id IS NOT NULL)
  ),
  CHECK (
    (status = 'NEW' AND assigned_at IS NULL AND transcribed_at IS NULL AND reviewed_at IS NULL AND completed_at IS NULL)
    OR
    (status = 'ASSIGNED' AND assigned_at IS NOT NULL AND transcribed_at IS NULL AND reviewed_at IS NULL AND completed_at IS NULL)
    OR
    (status = 'TRANSCRIBED' AND assigned_at IS NOT NULL AND transcribed_at IS NOT NULL AND reviewed_at IS NULL AND completed_at IS NULL)
    OR
    (status = 'REVIEWED' AND assigned_at IS NOT NULL AND transcribed_at IS NOT NULL AND reviewed_at IS NOT NULL AND completed_at IS NULL)
    OR
    (status = 'COMPLETED' AND assigned_at IS NOT NULL AND transcribed_at IS NOT NULL AND reviewed_at IS NOT NULL AND completed_at IS NOT NULL)
  ),
  CHECK (assigned_at IS NULL OR created_at <= assigned_at),
  CHECK (transcribed_at IS NULL OR assigned_at <= transcribed_at),
  CHECK (reviewed_at IS NULL OR transcribed_at <= reviewed_at),
  CHECK (completed_at IS NULL OR reviewed_at <= completed_at)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL UNIQUE REFERENCES jobs(id),
  reporter_id INTEGER NOT NULL REFERENCES reporters(id),
  editor_id INTEGER NOT NULL REFERENCES editors(id),
  reporter_amount INTEGER NOT NULL CHECK (reporter_amount >= 0),
  editor_amount INTEGER NOT NULL CHECK (editor_amount >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount = reporter_amount + editor_amount),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_reporter_id ON jobs(reporter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_editor_id ON jobs(editor_id);
`
