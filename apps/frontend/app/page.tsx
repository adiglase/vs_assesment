import { JobsDashboard } from "../components/jobs-dashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-950">
          Court Reporting Workflow
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Manage transcription jobs, court reporter assignments, editor review,
          workflow status, and payout records.
        </p>
      </header>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-medium text-zinc-950">Create Job</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Job creation form will be added after the backend API is ready.
        </p>
      </section>

      <JobsDashboard />
    </main>
  );
}
