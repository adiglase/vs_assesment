import type { Job } from "../../lib/api";
import {
  formatLocationType,
  formatStaffName,
  getStatusBadgeClass,
} from "./formatting";
import { JobActionCell } from "./job-action-cell";
import { PayoutCell } from "./payout-cell";
import type {
  EditorsState,
  JobsState,
  ReportersState,
  RowMutationStatuses,
} from "./types";

type JobsTableProps = {
  jobsState: JobsState;
  reportersState: ReportersState;
  editorsState: EditorsState;
  selectedReporterIds: Record<number, string>;
  selectedEditorIds: Record<number, string>;
  rowMutationStatuses: RowMutationStatuses;
  onSelectedReporterChange: (jobId: number, reporterId: string) => void;
  onSelectedEditorChange: (jobId: number, editorId: string) => void;
  onAssignPhysicalReporter: (jobId: number) => void;
  onAssignRemoteReporter: (jobId: number, reporterId: string) => void;
  onAssignEditor: (jobId: number, editorId: string) => void;
  onMarkTranscribed: (jobId: number) => void;
  onMarkReviewed: (jobId: number) => void;
  onCompleteJob: (jobId: number) => void;
};

function JobsRows({
  jobs,
  reportersState,
  editorsState,
  selectedReporterIds,
  selectedEditorIds,
  rowMutationStatuses,
  onSelectedReporterChange,
  onSelectedEditorChange,
  onAssignPhysicalReporter,
  onAssignRemoteReporter,
  onAssignEditor,
  onMarkTranscribed,
  onMarkReviewed,
  onCompleteJob,
}: Omit<JobsTableProps, "jobsState"> & { jobs: Job[] }) {
  return (
    <tbody className="divide-y divide-zinc-200">
      {jobs.map((job) => (
        <tr key={job.id}>
          <td className="whitespace-nowrap px-3 py-2 font-medium text-zinc-950">
            {job.caseName}
          </td>
          <td className="whitespace-nowrap px-3 py-2">
            <span className={getStatusBadgeClass(job.status)}>
              {job.status}
            </span>
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
            {job.durationMinutes} min
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
            {formatLocationType(job.locationType)}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
            {job.city ?? "-"}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
            {formatStaffName(job.reporter)}
          </td>
          <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
            {formatStaffName(job.editor)}
          </td>
          <td className="px-3 py-2 align-top">
            <PayoutCell job={job} />
          </td>
          <td className="min-w-64 px-3 py-2 align-top">
            <JobActionCell
              editorsState={editorsState}
              job={job}
              mutationStatus={rowMutationStatuses[job.id]}
              reportersState={reportersState}
              selectedEditorId={selectedEditorIds[job.id] ?? ""}
              selectedReporterId={selectedReporterIds[job.id] ?? ""}
              onAssignEditor={onAssignEditor}
              onAssignPhysicalReporter={onAssignPhysicalReporter}
              onAssignRemoteReporter={onAssignRemoteReporter}
              onCompleteJob={onCompleteJob}
              onMarkReviewed={onMarkReviewed}
              onMarkTranscribed={onMarkTranscribed}
              onSelectedEditorChange={onSelectedEditorChange}
              onSelectedReporterChange={onSelectedReporterChange}
            />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function JobsTable(props: JobsTableProps) {
  const { jobsState } = props;

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
                  <th className="px-3 py-2">Case</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Court Reporter</th>
                  <th className="px-3 py-2">Editor</th>
                  <th className="px-3 py-2">Payout</th>
                  <th className="px-3 py-2">Next Action</th>
                </tr>
              </thead>
              <JobsRows {...props} jobs={jobsState.jobs} />
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

