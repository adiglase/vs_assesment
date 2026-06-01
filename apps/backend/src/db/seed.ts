export const seedStaffSql = `
INSERT INTO reporters (id, name, city, availability) VALUES
  (1, 'Amelia Hart', 'Jakarta', 1),
  (2, 'Bima Santoso', 'Bandung', 1),
  (3, 'Clara Wijaya', 'Jakarta', 0);

INSERT INTO editors (id, name, availability) VALUES
  (1, 'Dewi Lestari', 1),
  (2, 'Evan Brooks', 1),
  (3, 'Farah Quinn', 0);
`

export const seedDemoSql = `
INSERT INTO jobs (
  id,
  case_name,
  duration_minutes,
  location_type,
  city,
  status,
  reporter_id,
  editor_id,
  created_at,
  updated_at,
  assigned_at,
  transcribed_at,
  reviewed_at,
  completed_at
) VALUES
  (
    1,
    'Jakarta licensing hearing',
    75,
    'PHYSICAL',
    'Jakarta',
    'NEW',
    NULL,
    NULL,
    '2026-06-01 09:00:00',
    '2026-06-01 09:00:00',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    2,
    'Remote witness deposition',
    45,
    'REMOTE',
    NULL,
    'NEW',
    NULL,
    NULL,
    '2026-06-01 09:10:00',
    '2026-06-01 09:10:00',
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    3,
    'Bandung commercial dispute',
    60,
    'PHYSICAL',
    'Bandung',
    'ASSIGNED',
    2,
    NULL,
    '2026-06-01 09:20:00',
    '2026-06-01 09:30:00',
    '2026-06-01 09:30:00',
    NULL,
    NULL,
    NULL
  ),
  (
    4,
    'Remote expert testimony',
    50,
    'REMOTE',
    NULL,
    'TRANSCRIBED',
    1,
    NULL,
    '2026-06-01 09:40:00',
    '2026-06-01 10:30:00',
    '2026-06-01 09:50:00',
    '2026-06-01 10:30:00',
    NULL,
    NULL
  ),
  (
    5,
    'Jakarta civil appeal',
    90,
    'PHYSICAL',
    'Jakarta',
    'REVIEWED',
    1,
    1,
    '2026-06-01 10:00:00',
    '2026-06-01 12:00:00',
    '2026-06-01 10:10:00',
    '2026-06-01 11:20:00',
    '2026-06-01 12:00:00',
    NULL
  ),
  (
    6,
    'Remote arbitration record',
    80,
    'REMOTE',
    NULL,
    'COMPLETED',
    2,
    2,
    '2026-06-01 10:20:00',
    '2026-06-01 13:40:00',
    '2026-06-01 10:30:00',
    '2026-06-01 12:00:00',
    '2026-06-01 13:00:00',
    '2026-06-01 13:40:00'
  );

INSERT INTO payments (
  id,
  job_id,
  reporter_id,
  editor_id,
  reporter_amount,
  editor_amount,
  total_amount,
  created_at
) VALUES
  (1, 6, 2, 2, 160000, 50000, 210000, '2026-06-01 13:40:00');
`

export const seedSql = `${seedStaffSql}${seedDemoSql}`
