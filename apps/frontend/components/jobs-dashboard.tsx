"use client";

import { useEffect, useState } from "react";
import { ApiError, getJobs, type Job } from "../lib/api";

type JobsState =
  | { status: "loading" }
  | { status: "loaded"; jobs: Job[] }
  | { status: "error"; message: string };

export function JobsDashboard() {
  const [jobsState, setJobsState] = useState<JobsState>({ status: "loading" });

  useEffect(() => {
    let ignoreResult = false;

    async function loadJobs() {
      setJobsState({ status: "loading" });

      try {
        const jobs = await getJobs();

        if (!ignoreResult) {
          setJobsState({ status: "loaded", jobs });
        }
      } catch (error) {
        if (!ignoreResult) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Could not load transcription jobs.";

          setJobsState({ status: "error", message });
        }
      }
    }

    void loadJobs();

    return () => {
      ignoreResult = true;
    };
  }, []);

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-zinc-950">Jobs</h2>
        {jobsState.status === "loaded" ? (
          <span className="text-xs font-medium uppercase text-zinc-500">
            {jobsState.jobs.length} total
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-4">
        {jobsState.status === "loading" ? (
          <p className="text-sm text-zinc-600">Loading transcription jobs...</p>
        ) : null}

        {jobsState.status === "error" ? (
          <div>
            <p className="text-sm font-medium text-red-700">
              Could not load jobs
            </p>
            <p className="mt-1 text-sm text-red-600">{jobsState.message}</p>
          </div>
        ) : null}

        {jobsState.status === "loaded" && jobsState.jobs.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No transcription jobs yet. Create one to start the workflow.
          </p>
        ) : null}

        {jobsState.status === "loaded" && jobsState.jobs.length > 0 ? (
          <ul className="divide-y divide-zinc-200">
            {jobsState.jobs.map((job) => (
              <li
                key={job.id}
                className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <p className="font-medium text-zinc-950">{job.caseName}</p>
                  <p className="text-zinc-600">
                    {job.durationMinutes} min · {job.locationType}
                    {job.city ? ` · ${job.city}` : ""}
                  </p>
                </div>
                <span className="w-fit rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700">
                  {job.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
