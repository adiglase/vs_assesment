import type { Job } from "../../lib/api";
import type {
  EditorsState,
  ReportersState,
  RowMutationStatus,
} from "./types";

type JobActionCellProps = {
  job: Job;
  mutationStatus: RowMutationStatus | undefined;
  reportersState: ReportersState;
  editorsState: EditorsState;
  selectedReporterId: string;
  selectedEditorId: string;
  onSelectedReporterChange: (jobId: number, reporterId: string) => void;
  onSelectedEditorChange: (jobId: number, editorId: string) => void;
  onAssignPhysicalReporter: (jobId: number) => void;
  onAssignRemoteReporter: (jobId: number, reporterId: string) => void;
  onAssignEditor: (jobId: number, editorId: string) => void;
  onMarkTranscribed: (jobId: number) => void;
  onMarkReviewed: (jobId: number) => void;
  onCompleteJob: (jobId: number) => void;
};

function FeedbackMessage({
  mutationStatus,
}: {
  mutationStatus: RowMutationStatus | undefined;
}) {
  if (mutationStatus?.status === "error") {
    return (
      <p className="max-w-56 whitespace-normal text-xs text-red-600">
        {mutationStatus.message}
      </p>
    );
  }

  if (mutationStatus?.status === "success") {
    return (
      <p className="max-w-56 whitespace-normal text-xs text-green-700">
        {mutationStatus.message}
      </p>
    );
  }

  return null;
}

export function JobActionCell({
  job,
  mutationStatus,
  reportersState,
  editorsState,
  selectedReporterId,
  selectedEditorId,
  onSelectedReporterChange,
  onSelectedEditorChange,
  onAssignPhysicalReporter,
  onAssignRemoteReporter,
  onAssignEditor,
  onMarkTranscribed,
  onMarkReviewed,
  onCompleteJob,
}: JobActionCellProps) {
  const isSubmitting = mutationStatus?.status === "submitting";

  if (job.status === "NEW" && job.locationType === "PHYSICAL") {
    return (
      <div className="grid gap-1">
        <button
          className="w-max rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isSubmitting}
          onClick={() => onAssignPhysicalReporter(job.id)}
          type="button"
        >
          {isSubmitting ? "Assigning..." : "Auto-assign reporter"}
        </button>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  if (job.status === "NEW" && job.locationType === "REMOTE") {
    if (reportersState.status === "loading") {
      return <span className="text-zinc-600">Loading reporters...</span>;
    }

    if (reportersState.status === "error") {
      return <span className="text-red-600">{reportersState.message}</span>;
    }

    return (
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label={`Court reporter for ${job.caseName}`}
            className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-950 outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            value={selectedReporterId}
            onChange={(event) =>
              onSelectedReporterChange(job.id, event.target.value)
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
            className="rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={!selectedReporterId || isSubmitting}
            onClick={() => onAssignRemoteReporter(job.id, selectedReporterId)}
            type="button"
          >
            {isSubmitting ? "Assigning..." : "Assign reporter"}
          </button>
        </div>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  if (job.status === "ASSIGNED") {
    return (
      <div className="grid gap-1">
        <button
          className="w-max rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isSubmitting}
          onClick={() => onMarkTranscribed(job.id)}
          type="button"
        >
          {isSubmitting ? "Updating..." : "Mark transcribed"}
        </button>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  if (job.status === "TRANSCRIBED" && job.editor === null) {
    if (editorsState.status === "loading") {
      return <span className="text-zinc-600">Loading editors...</span>;
    }

    if (editorsState.status === "error") {
      return <span className="text-red-600">{editorsState.message}</span>;
    }

    return (
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            aria-label={`Editor for ${job.caseName}`}
            className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-950 outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            value={selectedEditorId}
            onChange={(event) =>
              onSelectedEditorChange(job.id, event.target.value)
            }
          >
            <option value="">Select editor</option>
            {editorsState.editors.map((editor) => (
              <option
                disabled={!editor.availability}
                key={editor.id}
                value={editor.id}
              >
                {editor.name}
                {editor.availability ? "" : " - unavailable"}
              </option>
            ))}
          </select>

          <button
            className="rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={!selectedEditorId || isSubmitting}
            onClick={() => onAssignEditor(job.id, selectedEditorId)}
            type="button"
          >
            {isSubmitting ? "Assigning..." : "Assign editor"}
          </button>
        </div>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  if (job.status === "TRANSCRIBED" && job.editor !== null) {
    return (
      <div className="grid gap-1">
        <button
          className="w-max rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isSubmitting}
          onClick={() => onMarkReviewed(job.id)}
          type="button"
        >
          {isSubmitting ? "Updating..." : "Mark reviewed"}
        </button>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  if (job.status === "REVIEWED") {
    return (
      <div className="grid gap-1">
        <button
          className="w-max rounded bg-zinc-950 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={isSubmitting}
          onClick={() => onCompleteJob(job.id)}
          type="button"
        >
          {isSubmitting ? "Completing..." : "Complete job"}
        </button>

        <FeedbackMessage mutationStatus={mutationStatus} />
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <span className="text-zinc-500">
        {job.status === "COMPLETED" ? "No action" : "-"}
      </span>

      <FeedbackMessage mutationStatus={mutationStatus} />
    </div>
  );
}

