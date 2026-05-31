export const seedSql = `
INSERT INTO reporters (id, name, city, availability) VALUES
  (1, 'Amelia Hart', 'Jakarta', 1),
  (2, 'Bima Santoso', 'Bandung', 1),
  (3, 'Clara Wijaya', 'Jakarta', 0);

INSERT INTO editors (id, name, availability) VALUES
  (1, 'Dewi Lestari', 1),
  (2, 'Evan Brooks', 1),
  (3, 'Farah Quinn', 0);
`
