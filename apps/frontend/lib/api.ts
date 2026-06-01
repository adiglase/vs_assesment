export type JobStatus =
  | "NEW"
  | "ASSIGNED"
  | "TRANSCRIBED"
  | "REVIEWED"
  | "COMPLETED";

export type LocationType = "PHYSICAL" | "REMOTE";

export type Job = {
  id: number;
  caseName: string;
  durationMinutes: number;
  locationType: LocationType;
  city: string | null;
  status: JobStatus;
  reporter: {
    id: number;
    name: string;
  } | null;
  editor: {
    id: number;
    name: string;
  } | null;
  timestamps: {
    createdAt: string;
    updatedAt: string;
    assignedAt: string | null;
    transcribedAt: string | null;
    reviewedAt: string | null;
    completedAt: string | null;
  };
  payout: {
    id: number;
    reporterAmount: number;
    editorAmount: number;
    totalAmount: number;
    createdAt: string;
  } | null;
};

export type Reporter = {
  id: number;
  name: string;
  city: string;
  availability: boolean;
};

export type Editor = {
  id: number;
  name: string;
  availability: boolean;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type JobsResponse = {
  jobs: Job[];
};

type ReportersResponse = {
  reporters: Reporter[];
};

type JobResponse = {
  job: Job;
};

export type CreateJobInput = {
  caseName: string;
  durationMinutes: number;
  locationType: LocationType;
  city?: string;
};

const API_BASE_PATH = "/api";

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    let payload: ApiErrorPayload | null = null;

    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      throw new ApiError(fallbackMessage, "REQUEST_FAILED", response.status);
    }

    throw new ApiError(
      payload.error?.message ?? fallbackMessage,
      payload.error?.code ?? "REQUEST_FAILED",
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function getJobs(): Promise<Job[]> {
  const data = await requestJson<JobsResponse>("/jobs");
  return data.jobs;
}

export async function getReporters(): Promise<Reporter[]> {
  const data = await requestJson<ReportersResponse>("/reporters");
  return data.reporters;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const data = await requestJson<JobResponse>("/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.job;
}
