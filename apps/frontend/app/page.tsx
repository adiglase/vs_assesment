import { JobsDashboard } from "../components/jobs-dashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-950">
          Court Reporting Workflow
        </h1>
      </header>

      <JobsDashboard />
    </main>
  );
}
