import type { FormEvent } from "react";
import type { LocationType } from "../../lib/api";
import type { CreateJobFormState, CreateJobStatus } from "./types";

type CreateJobFormProps = {
  form: CreateJobFormState;
  status: CreateJobStatus;
  onChange: (form: CreateJobFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateJobForm({
  form,
  status,
  onChange,
  onSubmit,
}: CreateJobFormProps) {
  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-medium text-zinc-950">Create Job</h2>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-700">Case name</span>
          <input
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500"
            disabled={status.status === "submitting"}
            name="caseName"
            required
            value={form.caseName}
            onChange={(event) =>
              onChange({
                ...form,
                caseName: event.target.value,
              })
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-700">Duration minutes</span>
          <input
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500"
            disabled={status.status === "submitting"}
            min="1"
            name="durationMinutes"
            required
            type="number"
            value={form.durationMinutes}
            onChange={(event) =>
              onChange({
                ...form,
                durationMinutes: event.target.value,
              })
            }
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-700">Location type</span>
          <select
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500"
            disabled={status.status === "submitting"}
            name="locationType"
            value={form.locationType}
            onChange={(event) =>
              onChange({
                ...form,
                locationType: event.target.value as LocationType,
              })
            }
          >
            <option value="PHYSICAL">Physical</option>
            <option value="REMOTE">Remote</option>
          </select>
        </label>

        {form.locationType === "PHYSICAL" ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-zinc-700">City</span>
            <input
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm text-zinc-950 outline-none focus:border-zinc-500"
              disabled={status.status === "submitting"}
              name="city"
              required
              value={form.city}
              onChange={(event) =>
                onChange({
                  ...form,
                  city: event.target.value,
                })
              }
            />
          </label>
        ) : null}

        <div className="flex items-center gap-3 md:col-span-2">
          <button
            className="rounded bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={status.status === "submitting"}
            type="submit"
          >
            {status.status === "submitting" ? "Creating..." : "Create job"}
          </button>

          {status.status === "error" ? (
            <p className="text-sm text-red-600">{status.message}</p>
          ) : null}

          {status.status === "success" ? (
            <p className="text-sm text-green-700">{status.message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

