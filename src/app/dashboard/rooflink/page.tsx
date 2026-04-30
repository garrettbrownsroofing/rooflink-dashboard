import Link from "next/link";

export const dynamic = "force-dynamic";

async function getJson(path: string) {
  const res = await fetch(path, { cache: "no-store" });
  return (await res.json()) as any;
}

export default async function RooflinkDashboardHome() {
  const endpoints = await getJson("/api/rooflink/debug/endpoints");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RoofLink Reporting</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Read-only API integration debug + reporting.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/rooflink/jobs"
            className="h-10 inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 text-sm font-medium"
          >
            Jobs
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
        <div className="font-semibold">Endpoint health</div>
        <div className="mt-2 text-sm">
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/5 dark:bg-white/10 p-3 text-xs">
            {JSON.stringify(endpoints, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/api/rooflink/debug/schema"
          className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="font-semibold">Schema map</div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Inspect keys across list/detail/checklist endpoints.
          </div>
        </Link>
        <Link
          href="/api/rooflink/debug/prospects"
          className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="font-semibold">Prospects debug</div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Fetch first 10 prospects + normalized output.
          </div>
        </Link>
      </div>
    </div>
  );
}

