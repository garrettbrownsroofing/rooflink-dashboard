import { NextResponse } from "next/server";
import { RooflinkError, rooflinkFetch, rooflinkFetchPaginated } from "@/lib/rooflink";

export const runtime = "nodejs";

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (true) {
      const current = idx++;
      if (current >= tasks.length) return;
      results[current] = await tasks[current]();
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}

function getDateParams(url: URL) {
  const date_from = url.searchParams.get("date_from") ?? undefined;
  const date_to = url.searchParams.get("date_to") ?? undefined;
  return { date_from, date_to };
}

function withDates<T extends Record<string, unknown>>(
  base: T,
  dates: { date_from?: string; date_to?: string },
) {
  return {
    ...base,
    ...(dates.date_from ? { date_from: dates.date_from } : {}),
    ...(dates.date_to ? { date_to: dates.date_to } : {}),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dates = getDateParams(url);

  try {
    // Rooflink per-key rate limit is 5 req/sec; keep concurrency under that.
    const tasks = [
      async () => {
        const pageSize = Number(url.searchParams.get("jobs_page_size") ?? "100");
        const safePageSize =
          Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 250) : 100;

        const maxPagesParam = Number(url.searchParams.get("jobs_max_pages") ?? "100");
        const safeMaxPages =
          Number.isFinite(maxPagesParam) && maxPagesParam > 0
            ? Math.min(maxPagesParam, 200)
            : 100;

        const { results, count } = await rooflinkFetchPaginated<Record<string, unknown>>(
          "/light/job-report/",
          {
            query: withDates({ page_size: safePageSize }, dates),
          },
          { maxPages: safeMaxPages },
        );

        // Preserve a familiar paginated response shape for the UI.
        return { results, count };
      },
      () => rooflinkFetch("/light/jobs/pipeline/", { query: withDates({}, dates) }),
      () =>
        rooflinkFetch("/light/jobs/leads_by_source/", {
          query: withDates({ type: "approved_jobs" }, dates),
        }),
      () => rooflinkFetch("/light/jobs/leads_by_reps/", { query: withDates({}, dates) }),
      () =>
        rooflinkFetch("/light/jobs/sales_trend/", {
          query: withDates({ freq: "monthly", periods: 12 }, dates),
        }),
      () => rooflinkFetch("/light/jobs/approved/stats/", { query: withDates({}, dates) }),
      () => rooflinkFetch("/light/jobs/prospect/stats/", { query: withDates({}, dates) }),
    ];

    const [
      jobReport,
      pipeline,
      leadsBySource,
      leadsByReps,
      salesTrend,
      approvedStats,
      prospectStats,
    ] = await runWithConcurrency(tasks, 4);

    return NextResponse.json(
      {
        ok: true,
        dates,
        data: {
          jobReport,
          pipeline,
          leadsBySource,
          leadsByReps,
          salesTrend,
          approvedStats,
          prospectStats,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof RooflinkError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          details: err.details ?? null,
        },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error fetching Rooflink dashboard data.",
      },
      { status: 500 },
    );
  }
}

