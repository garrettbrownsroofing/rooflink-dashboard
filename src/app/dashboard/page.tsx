"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

type ApiOk = {
  ok: true;
  dates: { date_from?: string; date_to?: string };
  data: {
    jobReport: unknown;
    pipeline: unknown;
    leadsBySource: unknown;
    leadsByReps: unknown;
    salesTrend: unknown;
    approvedStats: unknown;
    prospectStats: unknown;
  };
};

type ApiErr = {
  ok: false;
  error: string;
  status?: number;
  details?: unknown;
};

type ApiResponse = ApiOk | ApiErr;

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toNumber(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function pickNumber(obj: unknown, keys: string[]) {
  if (!isRecord(obj)) return undefined;
  for (const k of keys) {
    const val = toNumber(obj[k]);
    if (val !== undefined) return val;
  }
  return undefined;
}

function asArray(v: unknown) {
  return Array.isArray(v) ? v : [];
}

function formatCurrency(n?: number) {
  if (n === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n?: number) {
  if (n === undefined) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function buildUrl(dateFrom: string, dateTo: string) {
  const u = new URL("/api/dashboard", window.location.origin);
  if (dateFrom) u.searchParams.set("date_from", dateFrom);
  if (dateTo) u.searchParams.set("date_to", dateTo);
  return u.toString();
}

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiOk | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(dateFrom, dateTo), { cache: "no-store" });
      const data = (await res.json()) as ApiResponse;
      if (!data.ok) {
        setPayload(null);
        setError(data.error ?? "Failed to load dashboard data.");
        return;
      }
      setPayload(data);
    } catch (e) {
      setPayload(null);
      setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    const approved = payload?.data.approvedStats;
    const prospect = payload?.data.prospectStats;
    const jobReport = payload?.data.jobReport;
    const pipeline = payload?.data.pipeline;

    const totalJobs =
      pickNumber(approved, ["total_jobs", "total", "count"]) ??
      pickNumber(jobReport, ["total_jobs", "count", "total"]);

    const completedJobs =
      pickNumber(approved, ["completed_jobs", "completed", "completed_count"]) ??
      pickNumber(jobReport, ["completed_jobs", "completed"]);

    const revenue =
      pickNumber(approved, ["revenue", "total_revenue", "gross_revenue"]) ??
      pickNumber(jobReport, ["revenue", "total_revenue"]);

    const avgJobValue =
      pickNumber(approved, ["average_job_value", "avg_job_value", "avg_value"]) ??
      (revenue !== undefined && totalJobs ? revenue / totalJobs : undefined);

    const totalApprovedJobs =
      pickNumber(approved, ["approved_jobs", "total_approved_jobs", "approved_count"]) ??
      totalJobs;

    const totalContractValue =
      pickNumber(approved, ["total_contract_value", "contract_value", "total_value"]) ??
      revenue;

    const jobsInProduction =
      pickNumber(pipeline, ["in_production", "production", "jobs_in_production"]) ??
      pickNumber(approved, ["in_production", "production"]);

    const signedProspects =
      pickNumber(prospect, ["signed_prospects", "signed", "signed_count"]) ??
      pickNumber(prospect, ["prospects_signed"]);

    return [
      { label: "Total jobs", value: formatNumber(totalJobs) },
      { label: "Completed jobs", value: formatNumber(completedJobs) },
      { label: "Revenue", value: formatCurrency(revenue) },
      { label: "Average job value", value: formatCurrency(avgJobValue) },
      { label: "Total approved jobs", value: formatNumber(totalApprovedJobs) },
      { label: "Total contract value", value: formatCurrency(totalContractValue) },
      { label: "Jobs in production", value: formatNumber(jobsInProduction) },
      { label: "Signed prospects", value: formatNumber(signedProspects) },
    ];
  }, [payload]);

  const salesTrendData = useMemo(() => {
    const raw = payload?.data.salesTrend;
    const list = asArray(isRecord(raw) ? raw.results ?? raw.data ?? raw : raw);
    return list
      .map((row) => {
        if (!isRecord(row)) return null;
        return {
          label: String(row.label ?? row.month ?? row.period ?? row.date ?? ""),
          value:
            toNumber(row.value) ??
            toNumber(row.sales) ??
            toNumber(row.revenue) ??
            toNumber(row.amount) ??
            0,
        };
      })
      .filter(Boolean) as { label: string; value: number }[];
  }, [payload]);

  const pipelineData = useMemo(() => {
    const raw = payload?.data.pipeline;
    const list = asArray(isRecord(raw) ? raw.stages ?? raw.results ?? raw.data ?? raw : raw);
    return list
      .map((row) => {
        if (!isRecord(row)) return null;
        const name = String(row.stage ?? row.name ?? row.label ?? "");
        const count = toNumber(row.count ?? row.jobs ?? row.value) ?? 0;
        return { name, count };
      })
      .filter(Boolean) as { name: string; count: number }[];
  }, [payload]);

  const leadSourceData = useMemo(() => {
    const raw = payload?.data.leadsBySource;
    const list = asArray(isRecord(raw) ? raw.sources ?? raw.results ?? raw.data ?? raw : raw);
    return list
      .map((row) => {
        if (!isRecord(row)) return null;
        const name = String(row.source ?? row.name ?? row.label ?? "");
        const count = toNumber(row.count ?? row.leads ?? row.value) ?? 0;
        return { name, count };
      })
      .filter(Boolean) as { name: string; count: number }[];
  }, [payload]);

  const repLeaderboard = useMemo(() => {
    const raw = payload?.data.leadsByReps;
    const list = asArray(isRecord(raw) ? raw.reps ?? raw.results ?? raw.data ?? raw : raw);
    return list
      .map((row) => {
        if (!isRecord(row)) return null;
        return {
          rep: String(row.rep ?? row.name ?? row.user ?? row.label ?? ""),
          leads: toNumber(row.leads ?? row.count ?? row.value) ?? 0,
          approved: toNumber(row.approved ?? row.approved_jobs ?? row.wins) ?? undefined,
          revenue: toNumber(row.revenue ?? row.total_revenue ?? row.amount) ?? undefined,
        };
      })
      .filter(Boolean) as {
      rep: string;
      leads: number;
      approved?: number;
      revenue?: number;
    }[];
  }, [payload]);

  const crewPerformance = useMemo(() => {
    const raw = payload?.data.jobReport;
    const list = asArray(isRecord(raw) ? raw.crews ?? raw.crew_performance ?? raw.results ?? raw.data ?? raw : raw);
    return list
      .map((row) => {
        if (!isRecord(row)) return null;
        return {
          crew: String(row.crew ?? row.name ?? row.label ?? ""),
          jobs: toNumber(row.jobs ?? row.count ?? row.total_jobs) ?? 0,
          revenue: toNumber(row.revenue ?? row.total_revenue ?? row.amount) ?? undefined,
        };
      })
      .filter(Boolean) as { crew: string; jobs: number; revenue?: number }[];
  }, [payload]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rooflink Dashboard</h1>
            <p className="text-sm text-black/60 dark:text-white/60">
              Server-side reporting (API key never reaches the browser).
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Date from</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-black/60 dark:text-white/60">Date to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 rounded-md border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-sm"
              />
            </label>
            <button
              onClick={() => void load()}
              className="h-10 rounded-md bg-black text-white dark:bg-white dark:text-black px-4 text-sm font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
            <div className="font-semibold">Error</div>
            <div className="text-black/70 dark:text-white/70">{error}</div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">
              Tip: confirm `ROOFLINK_API_KEY` is set in Vercel and redeploy.
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-3"
            >
              <div className="text-xs text-black/60 dark:text-white/60">{k.label}</div>
              <div className="mt-1 text-lg font-semibold">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div className="font-semibold">Sales trend</div>
              <div className="text-xs text-black/60 dark:text-white/60">Monthly • last 12</div>
            </div>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="mb-3 font-semibold">Pipeline</div>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="mb-3 font-semibold">Lead sources (approved jobs)</div>
            <div className="h-72">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadSourceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4">
            <div className="mb-3 font-semibold">Rep leaderboard</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-black/60 dark:text-white/60">
                  <tr>
                    <th className="py-2 text-left font-medium">Rep</th>
                    <th className="py-2 text-right font-medium">Leads</th>
                    <th className="py-2 text-right font-medium">Approved</th>
                    <th className="py-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {repLeaderboard.slice(0, 12).map((r) => (
                    <tr key={`${r.rep}-${r.leads}`} className="border-t border-black/5 dark:border-white/10">
                      <td className="py-2">{r.rep || "—"}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.leads)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(r.approved)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(r.revenue)}</td>
                    </tr>
                  ))}
                  {!repLeaderboard.length ? (
                    <tr>
                      <td className="py-3 text-black/60 dark:text-white/60" colSpan={4}>
                        No rep data returned for this date range.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/5 p-4 lg:col-span-2">
            <div className="mb-3 font-semibold">Crew performance</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-black/60 dark:text-white/60">
                  <tr>
                    <th className="py-2 text-left font-medium">Crew</th>
                    <th className="py-2 text-right font-medium">Jobs</th>
                    <th className="py-2 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {crewPerformance.slice(0, 12).map((c) => (
                    <tr key={`${c.crew}-${c.jobs}`} className="border-t border-black/5 dark:border-white/10">
                      <td className="py-2">{c.crew || "—"}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(c.jobs)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                  {!crewPerformance.length ? (
                    <tr>
                      <td className="py-3 text-black/60 dark:text-white/60" colSpan={3}>
                        No crew data returned for this date range.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-black/60 dark:text-white/60">
          Data is loaded from `src/app/api/dashboard/route.ts` (server-side only).
        </div>
      </div>
    </div>
  );
}

