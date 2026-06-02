"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  assignEditor,
  assignReporter,
  completeJob,
  createJob,
  getEditors,
  getJobs,
  getReporters,
  markReviewed,
  markTranscribed,
} from "../lib/api";
import { CreateJobForm } from "./jobs-dashboard/create-job-form";
import { JobsTable } from "./jobs-dashboard/jobs-table";
import type {
  CreateJobFormState,
  CreateJobStatus,
  EditorsState,
  JobsState,
  ReportersState,
  RowMutationKind,
  RowMutationStatuses,
} from "./jobs-dashboard/types";

type RefreshJobsOptions = {
  showLoading?: boolean;
};

const initialCreateJobForm: CreateJobFormState = {
  caseName: "",
  durationMinutes: "",
  locationType: "PHYSICAL",
  city: "",
};

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof ApiError ? error.message : fallbackMessage;
}

export function JobsDashboard() {
  const [jobsState, setJobsState] = useState<JobsState>({ status: "loading" });
  const [reportersState, setReportersState] = useState<ReportersState>({
    status: "loading",
  });
  const [editorsState, setEditorsState] = useState<EditorsState>({
    status: "loading",
  });
  const [selectedReporterIds, setSelectedReporterIds] = useState<
    Record<number, string>
  >({});
  const [selectedEditorIds, setSelectedEditorIds] = useState<
    Record<number, string>
  >({});
  const [rowMutationStatuses, setRowMutationStatuses] =
    useState<RowMutationStatuses>({});
  const [createForm, setCreateForm] = useState<CreateJobFormState>(
    initialCreateJobForm,
  );
  const [createStatus, setCreateStatus] = useState<CreateJobStatus>({
    status: "idle",
  });

  const refreshJobs = useCallback(async (options: RefreshJobsOptions = {}) => {
    if (options.showLoading ?? true) {
      setJobsState({ status: "loading" });
    }

    try {
      const jobs = await getJobs();
      setJobsState({ status: "loaded", jobs });
    } catch (error) {
      setJobsState({
        status: "error",
        message: getApiErrorMessage(
          error,
          "Could not load transcription jobs.",
        ),
      });
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
          setJobsState({
            status: "error",
            message: getApiErrorMessage(
              error,
              "Could not load transcription jobs.",
            ),
          });
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
          setReportersState({
            status: "error",
            message: getApiErrorMessage(error, "Could not load court reporters."),
          });
        }
      }
    }

    void loadInitialReporters();

    return () => {
      ignoreResult = true;
    };
  }, []);

  useEffect(() => {
    let ignoreResult = false;

    async function loadInitialEditors() {
      try {
        const editors = await getEditors();

        if (!ignoreResult) {
          setEditorsState({ status: "loaded", editors });
        }
      } catch (error) {
        if (!ignoreResult) {
          setEditorsState({
            status: "error",
            message: getApiErrorMessage(error, "Could not load editors."),
          });
        }
      }
    }

    void loadInitialEditors();

    return () => {
      ignoreResult = true;
    };
  }, []);

  function setRowSubmitting(jobId: number, kind: RowMutationKind) {
    setRowMutationStatuses((current) => ({
      ...current,
      [jobId]: { status: "submitting", kind },
    }));
  }

  function setRowSuccess(jobId: number, message: string) {
    setRowMutationStatuses((current) => ({
      ...current,
      [jobId]: { status: "success", message },
    }));
  }

  function setRowError(jobId: number, message: string) {
    setRowMutationStatuses((current) => ({
      ...current,
      [jobId]: { status: "error", message },
    }));
  }

  function handleSelectedReporterChange(jobId: number, reporterId: string) {
    setSelectedReporterIds((current) => ({
      ...current,
      [jobId]: reporterId,
    }));
  }

  function handleSelectedEditorChange(jobId: number, editorId: string) {
    setSelectedEditorIds((current) => ({
      ...current,
      [jobId]: editorId,
    }));
  }

  async function runRowMutation(
    jobId: number,
    kind: RowMutationKind,
    mutation: () => Promise<void>,
    successMessage: string,
    fallbackErrorMessage: string,
  ) {
    setRowSubmitting(jobId, kind);

    try {
      await mutation();
      await refreshJobs({ showLoading: false });
      setRowSuccess(jobId, successMessage);
    } catch (error) {
      setRowError(jobId, getApiErrorMessage(error, fallbackErrorMessage));
    }
  }

  async function handleAssignPhysicalReporter(jobId: number) {
    await runRowMutation(
      jobId,
      "assign-reporter",
      () => assignReporter(jobId).then(() => undefined),
      "Court reporter assigned.",
      "Could not assign a court reporter.",
    );
  }

  async function handleAssignRemoteReporter(
    jobId: number,
    selectedReporterId: string,
  ) {
    const reporterId = Number(selectedReporterId);

    if (!Number.isInteger(reporterId) || reporterId <= 0) {
      setRowError(jobId, "Select an available court reporter.");
      return;
    }

    await runRowMutation(
      jobId,
      "assign-reporter",
      async () => {
        await assignReporter(jobId, reporterId);
        setSelectedReporterIds((current) => {
          const remaining = { ...current };
          delete remaining[jobId];
          return remaining;
        });
      },
      "Court reporter assigned.",
      "Could not assign a court reporter.",
    );
  }

  async function handleAssignEditor(jobId: number, selectedEditorId: string) {
    const editorId = Number(selectedEditorId);

    if (!Number.isInteger(editorId) || editorId <= 0) {
      setRowError(jobId, "Select an available editor.");
      return;
    }

    await runRowMutation(
      jobId,
      "assign-editor",
      async () => {
        await assignEditor(jobId, editorId);
        setSelectedEditorIds((current) => {
          const remaining = { ...current };
          delete remaining[jobId];
          return remaining;
        });
      },
      "Editor assigned.",
      "Could not assign an editor.",
    );
  }

  async function handleMarkTranscribed(jobId: number) {
    await runRowMutation(
      jobId,
      "mark-transcribed",
      () => markTranscribed(jobId).then(() => undefined),
      "Transcription job marked transcribed.",
      "Could not mark the transcription job as transcribed.",
    );
  }

  async function handleMarkReviewed(jobId: number) {
    await runRowMutation(
      jobId,
      "mark-reviewed",
      () => markReviewed(jobId).then(() => undefined),
      "Transcription job marked reviewed.",
      "Could not mark the transcription job as reviewed.",
    );
  }

  async function handleCompleteJob(jobId: number) {
    await runRowMutation(
      jobId,
      "complete",
      () => completeJob(jobId).then(() => undefined),
      "Job completed. Payout record created.",
      "Could not complete the transcription job.",
    );
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
      setCreateStatus({
        status: "error",
        message: getApiErrorMessage(error, "Could not create transcription job."),
      });
    }
  }

  return (
    <>
      <CreateJobForm
        form={createForm}
        status={createStatus}
        onChange={setCreateForm}
        onSubmit={handleCreateJobSubmit}
      />

      <JobsTable
        editorsState={editorsState}
        jobsState={jobsState}
        reportersState={reportersState}
        rowMutationStatuses={rowMutationStatuses}
        selectedEditorIds={selectedEditorIds}
        selectedReporterIds={selectedReporterIds}
        onAssignEditor={(jobId, editorId) =>
          void handleAssignEditor(jobId, editorId)
        }
        onAssignPhysicalReporter={(jobId) =>
          void handleAssignPhysicalReporter(jobId)
        }
        onAssignRemoteReporter={(jobId, reporterId) =>
          void handleAssignRemoteReporter(jobId, reporterId)
        }
        onCompleteJob={(jobId) => void handleCompleteJob(jobId)}
        onMarkReviewed={(jobId) => void handleMarkReviewed(jobId)}
        onMarkTranscribed={(jobId) => void handleMarkTranscribed(jobId)}
        onSelectedEditorChange={handleSelectedEditorChange}
        onSelectedReporterChange={handleSelectedReporterChange}
      />
    </>
  );
}
