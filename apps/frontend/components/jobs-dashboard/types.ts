import type { Editor, Job, LocationType, Reporter } from "../../lib/api";

export type JobsState =
  | { status: "loading" }
  | { status: "loaded"; jobs: Job[] }
  | { status: "error"; message: string };

export type ReportersState =
  | { status: "loading" }
  | { status: "loaded"; reporters: Reporter[] }
  | { status: "error"; message: string };

export type EditorsState =
  | { status: "loading" }
  | { status: "loaded"; editors: Editor[] }
  | { status: "error"; message: string };

export type CreateJobFormState = {
  caseName: string;
  durationMinutes: string;
  locationType: LocationType;
  city: string;
};

export type CreateJobStatus =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type RowMutationKind =
  | "assign-reporter"
  | "assign-editor"
  | "mark-transcribed"
  | "mark-reviewed"
  | "complete";

export type RowMutationStatus =
  | { status: "submitting"; kind: RowMutationKind }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type RowMutationStatuses = Record<number, RowMutationStatus>;

