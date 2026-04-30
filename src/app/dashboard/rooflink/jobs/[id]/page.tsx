import { normalizeApprovedJob, normalizeProspect } from "@/lib/rooflink/normalizers";

export const dynamic = "force-dynamic";

async function getJson(path: string) {
  const res = await fetch(path, { cache: "no-store" });
  return (await res.json()) as any;
}

export default async function RooflinkJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await getJson(`/api/rooflink/debug/job/${id}`);

  const normalized = payload?.normalized ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Job {id}</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Normalized detail + raw JSON (read-only).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
          <div className="font-semibold">Normalized</div>
          <pre className="mt-3 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/5 dark:bg-white/10 p-3 text-xs">
            {JSON.stringify(normalized, null, 2)}
          </pre>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
          <div className="font-semibold">Raw</div>
          <pre className="mt-3 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/5 dark:bg-white/10 p-3 text-xs">
            {JSON.stringify(payload?.raw ?? payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

