import type { JobStatus, LocationType } from "../../lib/api";

export function formatLocationType(locationType: LocationType) {
  return locationType === "PHYSICAL" ? "Physical" : "Remote";
}

export function formatStaffName(staff: { name: string } | null) {
  return staff?.name ?? "Unassigned";
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatIdr(amount: number) {
  return idrFormatter.format(amount);
}

export function getStatusBadgeClass(status: JobStatus) {
  const baseClass = "rounded border px-1.5 py-0.5 text-xs font-medium";

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

