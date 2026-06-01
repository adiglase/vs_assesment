"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  assignReporter,
  createJob,
  getJobs,
  getReporters,
  type Job,
  type LocationType,
  type Reporter,
} from "../lib/api";

type JobsState =
  | { status: "loading" }
  | { status: "loaded"; jobs: Job[] }
  | { status: "error"; message: string };

type ReportersState =
  | { status: "loading" }
  | { status: "loaded"; reporters: Reporter[] }
  | { status: "error"; message: string };

type CreateJobFormState = {
  caseName: string;
  durationMinutes: string;
  locationType: LocationType;
  city: string;
};

type CreateJobStatus =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ReporterAssignmentStatus =
  | { status: "submitting" }
  | { status: "error"; message: string };

const initialCreateJobForm: CreateJobFormState = {
  caseName: "",
  durationMinutes: "",
  locationType: "PHYSICAL",
  city: "",
};

function formatLocationType(locationType: LocationType) {
  return locationType === "PHYSICAL" ? "Physical" : "Remote";
}

function formatStaffName(staff: { name: string } | null) {
  return staff?.name ?? "Unassigned";
}

export function JobsDashboard() {
  const [jobsState, setJobsState] = useState<JobsState>({ status: "loading" });
  const [reportersState, setReportersState] = useState<ReportersState>({
    status: "loading",
  });
  const [selectedReporterIds, setSelectedReporterIds] = useState<
    Record<number, string>
  >({});
  const [reporterAssignmentStatuses, setReporterAssignmentStatuses] = useState<
    Record<number, ReporterAssignmentStatus>
  >({});
  const [createForm, setCreateForm] = useState<CreateJobFormState>(
    initialCreateJobForm,
  );
  const [createStatus, setCreateStatus] = useState<CreateJobStatus>({
    status: "idle",
  });

  const refreshJobs = useCallback(async () => {
    setJobsState({ status: "loading" });

    try {
      const jobs = await getJobs();
      setJobsState({ status: "loaded", jobs });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not load transcription jobs.";

      setJobsState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    let ignoreResult = false;

    async function loadInitialJobs() {
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

    void loadInitialJobs();

    return () => {
      ignoreResult = true;
    };
  }, []);

  useEffect(() => {
    let ignoreResult = false;

    async function loadInitialReporters() {
      try {
        const reporters = await getReporters();

        if (!ignoreResult) {
          setReportersState({ status: "loaded", reporters });
        }
      } catch (error) {
        if (!ignoreResult) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Could not load court reporters.";

          setReportersState({ status: "error", message });
        }
      }
    }

    void loadInitialReporters();

    return () => {
      ignoreResult = true;
    };
  }, []);

  function renderReporterAssignmentCell(job: Job) {
    if (job.status !== "NEW") {
      return <span className="text-zinc-500">-</span>;
    }

    const assignmentStatus = reporterAssignmentStatuses[job.id];

    if (job.locationType === "PHYSICAL") {
      return (
        <div className="grid gap-2">
          <button
            className="w-max rounded bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={assignmentStatus?.status === "submitting"}
            onClick={() => void handleAssignPhysicalReporter(job.id)}
            type="button"
          >
            {assignmentStatus?.status === "submitting"
              ? "Assigning..."
              : "Auto-assign reporter"}
          </button>

          {assignmentStatus?.status === "error" ? (
            <p className="max-w-56 whitespace-normal text-sm text-red-600">
              {assignmentStatus.message}
            </p>
          ) : null}
        </div>
      );
    }

    if (reportersState.status === "loading") {
      return <span className="text-zinc-600">Loading reporters...</span>;
    }

    if (reportersState.status === "error") {
      return <span className="text-red-600">{reportersState.message}</span>;
    }

    return (
      <select
        aria-label={`Court reporter for ${job.caseName}`}
        className="w-56 rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500"
        value={selectedReporterIds[job.id] ?? ""}
        onChange={(event) =>
          setSelectedReporterIds((current) => ({
            ...current,
            [job.id]: event.target.value,
          }))
        }
      >
        <option value="">Select reporter</option>
        {reportersState.reporters.map((reporter) => (
          <option
            disabled={!reporter.availability}
            key={reporter.id}
            value={reporter.id}
          >
            {reporter.name} ({reporter.city})
            {reporter.availability ? "" : " - unavailable"}
          </option>
        ))}
      </select>
    );
  }

  async function handleAssignPhysicalReporter(jobId: number) {
    setReporterAssignmentStatuses((current) => ({
      ...current,
      [jobId]: { status: "submitting" },
    }));

    try {
      await assignReporter(jobId);
      await refreshJobs();

      setReporterAssignmentStatuses((current) => {
        const remaining = { ...current };
        delete remaining[jobId];
        return remaining;
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not assign a court reporter.";

      setReporterAssignmentStatuses((current) => ({
        ...current,
        [jobId]: { status: "error", message },
      }));
    }
  }

  async function handleCreateJobSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const caseName = createForm.caseName.trim();
    const durationMinutes = Number(createForm.durationMinutes);
    const city = createForm.city.trim();

    if (!caseName) {
      setCreateStatus({ status: "error", message: "Case name is required." });
      return;
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      setCreateStatus({
        status: "error",
        message: "Duration must be a whole number greater than zero.",
      });
      return;
    }

    if (createForm.locationType === "PHYSICAL" && !city) {
      setCreateStatus({
        status: "error",
        message: "City is required for physical jobs.",
      });
      return;
    }

    setCreateStatus({ status: "submitting" });

    try {
      await createJob({
        caseName,
        durationMinutes,
        locationType: createForm.locationType,
        ...(createForm.locationType === "PHYSICAL" ? { city } : {}),
      });

      setCreateForm(initialCreateJobForm);
      setCreateStatus({
        status: "success",
        message: "Transcription job created.",
      });
      await refreshJobs();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not create transcription job.";

      setCreateStatus({ status: "error", message });
    }
  }

  return (
    <>
      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-medium text-zinc-950">Create Job</h2>

        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={handleCreateJobSubmit}
        >
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-zinc-700">Case name</span>
            <input
              className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
              name="caseName"
              value={createForm.caseName}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  caseName: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-zinc-700">Duration minutes</span>
            <input
              className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
              min="1"
              name="durationMinutes"
              type="number"
              value={createForm.durationMinutes}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  durationMinutes: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-zinc-700">Location type</span>
            <select
              className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
              name="locationType"
              value={createForm.locationType}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  locationType: event.target.value as LocationType,
                }))
              }
            >
              <option value="PHYSICAL">Physical</option>
              <option value="REMOTE">Remote</option>
            </select>
          </label>

          {createForm.locationType === "PHYSICAL" ? (
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-zinc-700">City</span>
              <input
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                name="city"
                value={createForm.city}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                required
              />
            </label>
          ) : null}

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              className="rounded bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={createStatus.status === "submitting"}
              type="submit"
            >
              {createStatus.status === "submitting"
                ? "Creating..."
                : "Create job"}
            </button>

            {createStatus.status === "error" ? (
              <p className="text-sm text-red-600">{createStatus.message}</p>
            ) : null}

            {createStatus.status === "success" ? (
              <p className="text-sm text-green-700">{createStatus.message}</p>
            ) : null}
          </div>
        </form>
      </section>

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
            <p className="text-sm text-zinc-600">
              Loading transcription jobs...
            </p>
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
                    <th className="px-3 py-3">Reporter Assignment</th>
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
                      <td className="whitespace-nowrap px-3 py-3">
                        {renderReporterAssignmentCell(job)}
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
    </>
  );
}
