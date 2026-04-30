"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Api = { ok: true; data: unknown } | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asArray(v: unknown) {
  return Array.isArray(v) ? v : [];
}

function getJobName(job: unknown) {
  if (!isRecord(job)) return "—";
  const candidates = [
    job.name,
    (job as any).job_name,
    (job as any).title,
    (job as any).full_address,
    (job as any).address,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  const id = (job as any).id ?? (job as any).job_id;
  return typeof id === "number" || typeof id === "string" ? `Job ${id}` : "—";
}

function getCustomerName(job: unknown) {
  if (!isRecord(job)) return "";
  const c = (job as any).customer_name;
  if (typeof c === "string" && c.trim()) return c.trim();
  const customer = (job as any).customer;
  if (customer && typeof customer === "object") {
    const n = (customer as any).name ?? (customer as any).full_name ?? (customer as any).display_name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  return "";
}

function buildJobsUrl(source: string, page: number, pageSize: number, search: string) {
  const u = new URL("/api/jobs", window.location.origin);
  u.searchParams.set("source", source);
  u.searchParams.set("page", String(page));
  u.searchParams.set("page_size", String(pageSize));
  if (search.trim()) u.searchParams.set("search", search.trim());
  return u.toString();
}

export default function RooflinkJobsPage() {
  const [source, setSource] = useState("approved");
  const [search, setSearch] = useState("");
  const [pageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState<number | null | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    const nextPage = reset ? 1 : page;
    try {
      const res = await fetch(buildJobsUrl(source, nextPage, pageSize, search), { cache: "no-store" });
      const data = (await res.json()) as any;
      if (!data.ok) {
        setError(data.error ?? "Failed to load jobs.");
        return;
      }

      const payload = data.data;
      const listRaw = isRecord(payload) ? (payload.results ?? payload.jobs ?? payload.data ?? payload) : payload;
      const list = asArray(listRaw).filter((x) => isRecord(x)) as Record<string, unknown>[];

      setCount(isRecord(payload) ? (payload.count as any) : undefined);
      setRows((prev) => (reset ? list : [...prev, ...list]));

      const nextPageValue = isRecord(payload) ? (payload.next_page as any) : null;
      const more =
        typeof nextPageValue === "number"
          ? nextPageValue > nextPage
          : typeof nextPageValue === "string"
            ? Number(nextPageValue) > nextPage
            : list.length === pageSize;
      setHasMore(more);
      setPage(reset ? 2 : nextPage + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const filteredLocal = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => getJobName(r).toLowerCase().includes(q) || getCustomerName(r).toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RoofLink Jobs</h1>
          <div className="text-sm text-black/60 dark:text-white/60">
            Read-only list view (paginated).
          </div>
        </div>
        <Link
          href="/dashboard/rooflink"
          className="h-10 inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 text-sm font-medium"
        >
          Back
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-black/60 dark:text-white/60">Source</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
          >
            <option value="approved">Approved</option>
            <option value="prospect">Prospects</option>
            <option value="public">Public</option>
            <option value="job-report">Job report</option>
            <option value="jobs">Everything (debug)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
          <span className="text-black/60 dark:text-white/60">Search (client-side)</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Customer, job name, address..."
            className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
          <div className="font-semibold">Error</div>
          <div className="text-black/70 dark:text-white/70">{error}</div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-black/60 dark:text-white/60">
        Loaded <span className="font-medium text-foreground">{filteredLocal.length}</span> rows locally
        {typeof count === "number" || count === null ? (
          <>
            {" "}
            • API count: <span className="font-medium text-foreground">{String(count)}</span>
          </>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {filteredLocal.slice(0, 200).map((job, idx) => {
            const id = (job as any).id ?? (job as any).job_id ?? idx;
            return (
              <Link
                key={String(id)}
                href={`/dashboard/rooflink/jobs/${id}`}
                className="block px-3 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="text-sm font-medium truncate">{getJobName(job)}</div>
                <div className="text-xs text-black/60 dark:text-white/60 truncate">
                  {getCustomerName(job) ? `Customer: ${getCustomerName(job)} • ` : ""}
                  ID: {String(id)}
                </div>
              </Link>
            );
          })}
          {!filteredLocal.length && !loading ? (
            <div className="px-3 py-4 text-sm text-black/60 dark:text-white/60">No results.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => void load(true)}
          className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 text-sm font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading…" : "Reload"}
        </button>
        <button
          onClick={() => void load(false)}
          className="h-10 rounded-md bg-black text-white dark:bg-white dark:text-black px-4 text-sm font-medium disabled:opacity-50"
          disabled={loading || !hasMore}
        >
          {loading ? "Loading…" : hasMore ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}

