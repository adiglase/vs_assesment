# Backend

Express API for the court reporting workflow assessment.

## Scripts

Run from the repository root:

```sh
npm run dev:backend
npm run db:reset --workspace backend
npm test --workspace backend
npm run build --workspace backend
```

The backend listens on port `3001` by default. Set `PORT` to override it.

`db:reset` recreates the SQLite database with reviewer-ready seed data: court reporters, editors, demo transcription jobs across the workflow, and one completed job with a payout record.
