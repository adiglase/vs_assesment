"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  getJobs,
  type Job,
  type LocationType,
} from "../lib/api";

type JobsState =
  | { status: "loading" }
  | { status: "loaded"; jobs: Job[] }
  | { status: "error"; message: string };

function formatLocationType(locationType: LocationType) {
  return locationType === "PHYSICAL" ? "Physical" : "Remote";
}

function formatStaffName(staff: { name: string } | null) {
  return staff?.name ?? "Unassigned";
}

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

      <div className="mt-4">
        {jobsState.status === "loading" ? (
          <p className="text-sm text-zinc-600">Loading transcription jobs...</p>
        ) : null}

        {jobsState.status === "error" ? (
          <div className="border-l-2 border-red-500 pl-3">
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Case</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">City</th>
                  <th className="px-3 py-3">Court Reporter</th>
                  <th className="px-3 py-3">Editor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {jobsState.jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-zinc-950">
                      {job.caseName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700">
                        {job.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {job.durationMinutes} min
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {formatLocationType(job.locationType)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {job.city ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {formatStaffName(job.reporter)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                      {formatStaffName(job.editor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
