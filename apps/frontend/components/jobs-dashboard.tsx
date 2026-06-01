"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  assignReporter,
  createJob,
  getJobs,
  getReporters,
  markTranscribed,
  type Job,
  type JobStatus,
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

type WorkflowTransitionStatus =
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

function getStatusBadgeClass(status: JobStatus) {
  const baseClass = "rounded border px-2 py-1 text-xs font-medium";

  switch (status) {
    case "NEW":
      return `${baseClass} border-zinc-300 bg-zinc-50 text-zinc-700`;
    case "ASSIGNED":
      return `${baseClass} border-blue-200 bg-blue-50 text-blue-700`;
    case "TRANSCRIBED":
      return `${baseClass} border-amber-200 bg-amber-50 text-amber-800`;
    case "REVIEWED":
      return `${baseClass} border-violet-200 bg-violet-50 text-violet-700`;
    case "COMPLETED":
      return `${baseClass} border-green-200 bg-green-50 text-green-700`;
  }
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
  const [workflowTransitionStatuses, setWorkflowTransitionStatuses] = useState<
    Record<number, WorkflowTransitionStatus>
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

    const selectedReporterId = selectedReporterIds[job.id] ?? "";
    const isSubmitting = assignmentStatus?.status === "submitting";

    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={`Court reporter for ${job.caseName}`}
            className="w-56 rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            value={selectedReporterId}
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

          <button
            className="rounded bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={!selectedReporterId || isSubmitting}
            onClick={() =>
              void handleAssignRemoteReporter(job.id, selectedReporterId)
            }
            type="button"
          >
            {isSubmitting ? "Assigning..." : "Assign reporter"}
          </button>
        </div>

        {assignmentStatus?.status === "error" ? (
          <p className="max-w-56 whitespace-normal text-sm text-red-600">
            {assignmentStatus.message}
          </p>
        ) : null}
      </div>
    );
  }

  function renderWorkflowActionCell(job: Job) {
    if (job.status !== "ASSIGNED") {
      return <span className="text-zinc-500">-</span>;
    }

    const transitionStatus = workflowTransitionStatuses[job.id];
    const isSubmitting = transitionStatus?.status === "submitting";

    return (
      <div className="grid gap-2">
        <button
          className="w-max cursor-pointer rounded bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isSubmitting}
          onClick={() => void handleMarkTranscribed(job.id)}
          type="button"
        >
          {isSubmitting ? "Updating..." : "Mark transcribed"}
        </button>

        {transitionStatus?.status === "error" ? (
          <p className="max-w-56 whitespace-normal text-sm text-red-600">
            {transitionStatus.message}
          </p>
        ) : null}
      </div>
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

  async function handleAssignRemoteReporter(
    jobId: number,
    selectedReporterId: string,
  ) {
    const reporterId = Number(selectedReporterId);

    if (!Number.isInteger(reporterId) || reporterId <= 0) {
      setReporterAssignmentStatuses((current) => ({
        ...current,
        [jobId]: {
          status: "error",
          message: "Select an available court reporter.",
        },
      }));
      return;
    }

    setReporterAssignmentStatuses((current) => ({
      ...current,
      [jobId]: { status: "submitting" },
    }));

    try {
      await assignReporter(jobId, reporterId);
      await refreshJobs();

      setSelectedReporterIds((current) => {
        const remaining = { ...current };
        delete remaining[jobId];
        return remaining;
      });

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

  async function handleMarkTranscribed(jobId: number) {
    setWorkflowTransitionStatuses((current) => ({
      ...current,
      [jobId]: { status: "submitting" },
    }));

    try {
      await markTranscribed(jobId);
      await refreshJobs();

      setWorkflowTransitionStatuses((current) => {
        const remaining = { ...current };
        delete remaining[jobId];
        return remaining;
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not mark the transcription job as transcribed.";

      setWorkflowTransitionStatuses((current) => ({
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
                    <th className="px-3 py-3">Workflow</th>
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
                        <span className={getStatusBadgeClass(job.status)}>
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
                      <td className="whitespace-nowrap px-3 py-3">
                        {renderWorkflowActionCell(job)}
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
