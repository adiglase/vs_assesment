import type { Job } from "../../lib/api";
import { formatIdr } from "./formatting";

type PayoutCellProps = {
  job: Job;
};

export function PayoutCell({ job }: PayoutCellProps) {
  if (job.status !== "COMPLETED" || job.payout === null) {
    return <span className="text-zinc-500">No payout</span>;
  }

  return (
    <dl className="grid min-w-40 gap-1 text-xs text-zinc-700">
      <div className="flex items-center justify-between gap-4">
        <dt>Reporter</dt>
        <dd className="font-medium text-zinc-900">
          {formatIdr(job.payout.reporterAmount)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt>Editor</dt>
        <dd className="font-medium text-zinc-900">
          {formatIdr(job.payout.editorAmount)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-1">
        <dt className="font-medium text-zinc-900">Total</dt>
        <dd className="font-semibold text-zinc-950">
          {formatIdr(job.payout.totalAmount)}
        </dd>
      </div>
    </dl>
  );
}

