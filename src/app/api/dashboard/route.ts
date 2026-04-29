import { NextResponse } from "next/server";
import { RooflinkError, rooflinkFetch } from "@/lib/rooflink";

export const runtime = "nodejs";

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
    const [
      jobReport,
      pipeline,
      leadsBySource,
      leadsByReps,
      salesTrend,
      approvedStats,
      prospectStats,
    ] = await Promise.all([
      rooflinkFetch("/light/job-report/", { query: withDates({}, dates) }),
      rooflinkFetch("/light/jobs/pipeline/", { query: withDates({}, dates) }),
      rooflinkFetch("/light/jobs/leads_by_source/", {
        query: withDates({ type: "approved_jobs" }, dates),
      }),
      rooflinkFetch("/light/jobs/leads_by_reps/", { query: withDates({}, dates) }),
      rooflinkFetch("/light/jobs/sales_trend/", {
        query: withDates({ freq: "monthly", periods: 12 }, dates),
      }),
      rooflinkFetch("/light/jobs/approved/stats/", { query: withDates({}, dates) }),
      rooflinkFetch("/light/jobs/prospect/stats/", { query: withDates({}, dates) }),
    ]);

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

